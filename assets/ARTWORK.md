# Local pavement artwork, 2026-11-09

The approved original `town-map.webp` is preserved byte for byte. Buildings and streets retain their original positions. The image-generation edit tool supplied two local artwork patches. `scene.js` restricts them to the requested regions; the zebra paint is vector geometry aligned exactly with the walking graph.

- `side-pavements-v2.webp`: 430 × 280 crop at world (930, 540). Clear the shrub on the right side of the post office, the tree and shrubs on both sides of the library and its front beds; replace the cleared ground with matching pink tiled pavement. Keep buildings, entrance steps, curb boundaries, camera and layout fixed. No added people, vehicles, signs or text.
- `bottom-pavement-v2.webp`: 400 × 150 crop at world (0, 936). Remove the old lowest left zebra paint and the first planter on the bottom promenade; restore matching asphalt and tiled pavement. Preserve the crop, perspective, curb and tile grid. No new zebra in the bitmap: the game draws it at world x=165, aligned with the crossing above.

Only these local patches are used from the generated images. All other areas retain the original artwork. The built-in image-generation editor was used, followed by cropping and WebP encoding for the game. The patches together add about 43 KB.
