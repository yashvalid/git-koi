//! A pixel-art night sky behind the koi: a dithered nebula band, twinkling stars, and
//! a small ringed planet, painted into every transparent pixel of a rendered frame.
//!
//! The sky is a separate stage after [`crate::render`], so the renderer keeps drawing
//! the koi on transparent surroundings. Stars twinkle a whole number of times per loop,
//! so a looping GIF never jumps. The sky uses a small fixed palette, leaving the koi
//! almost all of a GIF frame's colors. Identical inputs produce identical pixels without
//! I/O, clock reads, or input mutation.

use std::f64::consts::TAU;

use crate::render::{FRAME_HEIGHT_PIXELS, FRAME_WIDTH_PIXELS, KoiFrame, calculate_dither_threshold};

/// Deep space to bright nebula, dithered between neighbors.
const NEBULA_RAMP: [[u8; 3]; 6] = [
    [8, 8, 20],
    [16, 14, 40],
    [30, 20, 64],
    [52, 28, 96],
    [86, 40, 124],
    [128, 64, 150],
];
const STAR_DIM: [u8; 3] = [90, 96, 130];
const STAR_COLORS: [[u8; 3]; 3] = [[255, 255, 255], [255, 226, 170], [180, 210, 255]];
const STAR_GLOW: [u8; 3] = [150, 160, 210];
/// Planet shading, lit to dark.
const PLANET_RAMP: [[u8; 3]; 4] = [[232, 140, 100], [184, 92, 80], [118, 52, 66], [58, 26, 46]];
const RING_COLORS: [[u8; 3]; 2] = [[214, 184, 150], [140, 112, 104]];

/// Paint the sky behind a frame. `loop_fraction` is the frame's place in its loop, from
/// zero up to one; zero and one give the same sky, so loops stay seamless. Opaque koi
/// pixels are kept as drawn, and every other pixel becomes sky.
pub fn paint_space(koi_frame: &KoiFrame, loop_fraction: f64) -> KoiFrame {
    let koi_pixels = koi_frame.as_rgba_bytes().as_chunks::<4>().0;
    let rgba_pixels = koi_pixels
        .iter()
        .enumerate()
        .map(|(pixel_index, &koi_pixel)| {
            if koi_pixel[3] != 0 {
                return koi_pixel;
            }
            let pixel_x = pixel_index as u32 % FRAME_WIDTH_PIXELS;
            let pixel_y = pixel_index as u32 / FRAME_WIDTH_PIXELS;
            let [red, green, blue] = sky_color(pixel_x, pixel_y, loop_fraction);
            [red, green, blue, 255]
        })
        .collect();
    KoiFrame::from_rgba_pixels(rgba_pixels)
}

fn sky_color(pixel_x: u32, pixel_y: u32, loop_fraction: f64) -> [u8; 3] {
    planet_color(pixel_x, pixel_y)
        .or_else(|| star_color(pixel_x, pixel_y, loop_fraction))
        .unwrap_or_else(|| nebula_color(pixel_x, pixel_y))
}

/// A diagonal band of soft value noise, quantized onto the ramp by ordered dithering.
fn nebula_color(pixel_x: u32, pixel_y: u32) -> [u8; 3] {
    const BAND_WIDTH_PIXELS: f64 = 70.0;
    let [x, y] = [f64::from(pixel_x), f64::from(pixel_y)];
    let band_offset = (x - 0.8 * y - 40.0) / BAND_WIDTH_PIXELS;
    let band = (-band_offset * band_offset).exp();
    let cloud = 0.55 * value_noise(x, y, 48.0, 1)
        + 0.3 * value_noise(x, y, 20.0, 2)
        + 0.15 * value_noise(x, y, 8.0, 3);
    let intensity = (band * (0.35 + cloud) - 0.12).clamp(0.0, 1.0);
    let ramp_position = intensity * (NEBULA_RAMP.len() - 1) as f64;
    let lower_index = ramp_position.floor() as usize;
    let step_up = ramp_position.fract() > calculate_dither_threshold([pixel_x, pixel_y]);
    NEBULA_RAMP[(lower_index + usize::from(step_up)).min(NEBULA_RAMP.len() - 1)]
}

/// Scattered stars; the brightest flare into a small cross at the peak of a twinkle.
fn star_color(pixel_x: u32, pixel_y: u32, loop_fraction: f64) -> Option<[u8; 3]> {
    const STARS_PER_THOUSAND_PIXELS: u32 = 6;
    const TWINKLES_PER_LOOP: f64 = 2.0;
    let twinkle = |star_hash: u32| {
        let phase = f64::from(star_hash >> 24) / 256.0;
        0.5 + 0.5 * (TAU * (TWINKLES_PER_LOOP * loop_fraction + phase)).sin()
    };
    let is_star = |star_x: u32, star_y: u32| {
        hash_pixel(star_x, star_y, 0) % 1000 < STARS_PER_THOUSAND_PIXELS
    };
    if is_star(pixel_x, pixel_y) {
        let star_hash = hash_pixel(pixel_x, pixel_y, 0);
        let star_twinkle = twinkle(star_hash);
        if star_twinkle < 0.25 {
            return Some(STAR_DIM);
        }
        return Some(STAR_COLORS[(star_hash >> 12) as usize % STAR_COLORS.len()]);
    }
    // Arms of a flaring bright star: one in four stars is bright.
    let neighbors = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    neighbors.iter().find_map(|&[step_x, step_y]| {
        let star_x = pixel_x.checked_add_signed(step_x)?;
        let star_y = pixel_y.checked_add_signed(step_y)?;
        if star_x >= FRAME_WIDTH_PIXELS || star_y >= FRAME_HEIGHT_PIXELS {
            return None;
        }
        let star_hash = hash_pixel(star_x, star_y, 0);
        let is_bright = (star_hash >> 8) % 4 == 0;
        (is_star(star_x, star_y) && is_bright && twinkle(star_hash) > 0.7).then_some(STAR_GLOW)
    })
}

/// A small planet in the top-right corner, lit from the upper left, with a flat ring
/// that passes behind it above and in front of it below.
fn planet_color(pixel_x: u32, pixel_y: u32) -> Option<[u8; 3]> {
    const CENTER: [f64; 2] = [212.0, 44.0];
    const RADIUS_PIXELS: f64 = 14.0;
    const RING_INNER: f64 = 1.35;
    const RING_OUTER: f64 = 1.75;
    const RING_FLATTENING: f64 = 0.3;
    let offset_x = (f64::from(pixel_x) - CENTER[0]) / RADIUS_PIXELS;
    let offset_y = (f64::from(pixel_y) - CENTER[1]) / RADIUS_PIXELS;
    let disc_distance = (offset_x * offset_x + offset_y * offset_y).sqrt();
    let ring_distance = (offset_x * offset_x + (offset_y / RING_FLATTENING).powi(2)).sqrt();
    let in_ring = (RING_INNER..RING_OUTER).contains(&ring_distance);
    let in_disc = disc_distance < 1.0;
    if in_ring && (offset_y > 0.0 || !in_disc) {
        let ring_index = usize::from(ring_distance > (RING_INNER + RING_OUTER) / 2.0);
        return Some(RING_COLORS[ring_index]);
    }
    if !in_disc {
        return None;
    }
    let surface_z = (1.0 - disc_distance * disc_distance).sqrt();
    let lighting = (-0.6 * offset_x - 0.5 * offset_y + 0.62 * surface_z).clamp(0.0, 1.0);
    let ramp_position = (1.0 - lighting) * (PLANET_RAMP.len() - 1) as f64;
    let lower_index = ramp_position.floor() as usize;
    let step_down = ramp_position.fract() > calculate_dither_threshold([pixel_x, pixel_y]);
    Some(PLANET_RAMP[(lower_index + usize::from(step_down)).min(PLANET_RAMP.len() - 1)])
}

/// Smooth value noise from zero through one, on a grid of `cell_pixels`.
fn value_noise(x: f64, y: f64, cell_pixels: f64, salt: u32) -> f64 {
    let [cell_x, cell_y] = [(x / cell_pixels).floor(), (y / cell_pixels).floor()];
    let smooth = |fraction: f64| fraction * fraction * (3.0 - 2.0 * fraction);
    let [blend_x, blend_y] = [smooth(x / cell_pixels - cell_x), smooth(y / cell_pixels - cell_y)];
    let corner = |step_x: f64, step_y: f64| {
        f64::from(hash_pixel((cell_x + step_x) as u32, (cell_y + step_y) as u32, salt))
            / f64::from(u32::MAX)
    };
    let top = corner(0.0, 0.0) + (corner(1.0, 0.0) - corner(0.0, 0.0)) * blend_x;
    let bottom = corner(0.0, 1.0) + (corner(1.0, 1.0) - corner(0.0, 1.0)) * blend_x;
    top + (bottom - top) * blend_y
}

fn hash_pixel(pixel_x: u32, pixel_y: u32, salt: u32) -> u32 {
    let mut hash = pixel_x.wrapping_mul(0x8da6_b343)
        ^ pixel_y.wrapping_mul(0xd816_3841)
        ^ salt.wrapping_mul(0xcb1a_b31f);
    hash ^= hash >> 13;
    hash = hash.wrapping_mul(0x5bd1_e995);
    hash ^ (hash >> 15)
}

#[cfg(test)]
mod tests {
    use super::*;

    const FRAME_PIXEL_COUNT: usize = (FRAME_WIDTH_PIXELS * FRAME_HEIGHT_PIXELS) as usize;

    fn frame_with_one_koi_pixel(koi_pixel: [u8; 4]) -> KoiFrame {
        let mut rgba_pixels = vec![[0; 4]; FRAME_PIXEL_COUNT];
        rgba_pixels[FRAME_PIXEL_COUNT / 2] = koi_pixel;
        KoiFrame::from_rgba_pixels(rgba_pixels)
    }

    #[test]
    fn the_sky_fills_every_transparent_pixel_and_keeps_the_koi() {
        let koi_pixel = [1, 2, 3, 255];
        let sky_frame = paint_space(&frame_with_one_koi_pixel(koi_pixel), 0.3);
        let sky_pixels = sky_frame.as_rgba_bytes().as_chunks::<4>().0;
        assert!(sky_pixels.iter().all(|pixel| pixel[3] == 255));
        assert_eq!(sky_pixels[FRAME_PIXEL_COUNT / 2], koi_pixel);
    }

    #[test]
    fn the_loop_ends_where_it_starts_and_the_stars_twinkle_in_between() {
        let empty_frame = frame_with_one_koi_pixel([0; 4]);
        assert_eq!(paint_space(&empty_frame, 0.0), paint_space(&empty_frame, 1.0));
        assert_ne!(paint_space(&empty_frame, 0.0), paint_space(&empty_frame, 0.25));
    }

    #[test]
    fn the_sky_leaves_the_koi_most_of_a_gif_palette() {
        let empty_frame = frame_with_one_koi_pixel([0; 4]);
        let sky_colors: std::collections::BTreeSet<[u8; 4]> = (0..8)
            .flat_map(|step| {
                let sky_frame = paint_space(&empty_frame, f64::from(step) / 8.0);
                sky_frame.as_rgba_bytes().as_chunks::<4>().0.to_vec()
            })
            .collect();
        assert!(sky_colors.len() <= 20, "{} sky colors", sky_colors.len());
    }
}
