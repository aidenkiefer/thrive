# Photo re-hosting session — 2026-11-24

- Branch: `codex/experience-photo-rehost`, based on `origin/main` at `40d8816`.
- Scope: public photo assets and `src/components/content/photos.ts` only. Owner confirmed reuse rights for all WordPress media and authorized these downloads in the 2026-11-24 chat.
- Downloaded each source over HTTPS, confirmed an image response, decoded it with Sharp, and generated same-origin WebP at the source dimensions or no more than 1080px wide. Every output is under 300 KiB.
- No live database, Supabase Storage, DNS, or public URL change was made.

| Key | WordPress source | New local file | Dimensions | Bytes |
| --- | --- | --- | ---: | ---: |
| water | https://thrivevineyard.com/wp-content/uploads/2024/08/lakesquare.jpg | images/church/wordpress-water.webp | 1080×1080 | 157650 |
| kevin | https://thrivevineyard.com/wp-content/uploads/2024/04/kevin-wall.jpg | images/church/wordpress-kevin.webp | 800×800 | 88102 |
| molly | https://thrivevineyard.com/wp-content/uploads/2024/04/Mollywall-scaled-e1714258419441.jpeg | images/church/wordpress-molly.webp | 800×800 | 63532 |
| jjay | https://thrivevineyard.com/wp-content/uploads/2024/04/Jjay-wall-e1714855730602.jpg | images/church/wordpress-jjay.webp | 541×541 | 48860 |
| carley | https://thrivevineyard.com/wp-content/uploads/2024/04/Carley-Wall.jpg | images/church/wordpress-carley.webp | 800×800 | 40974 |
| mikeAndTami | https://thrivevineyard.com/wp-content/uploads/2024/04/Mike-and-Tami.jpg | images/church/wordpress-mikeAndTami.webp | 800×800 | 61696 |
| royAndJulie | https://thrivevineyard.com/wp-content/uploads/2024/04/Roy-and-Julie.jpg | images/church/wordpress-royAndJulie.webp | 800×800 | 72532 |
| michiAndNathan | https://thrivevineyard.com/wp-content/uploads/2024/04/Michi-and-Nathan.jpg | images/church/wordpress-michiAndNathan.webp | 800×800 | 88342 |
| jjayAndJustin | https://thrivevineyard.com/wp-content/uploads/2024/04/JJay-and-Justin.jpg | images/church/wordpress-jjayAndJustin.webp | 800×800 | 74954 |
| mary | https://thrivevineyard.com/wp-content/uploads/2024/05/Mary-e1714853998990.jpeg | images/church/wordpress-mary.webp | 768×769 | 48316 |
| kidsNewborns | https://thrivevineyard.com/wp-content/uploads/2022/12/kids-newborns_600x400-1.jpg | images/church/wordpress-kidsNewborns.webp | 600×400 | 23454 |
| kidsPreschool | https://thrivevineyard.com/wp-content/uploads/2022/12/kids-preschool_600x400-1.jpg | images/church/wordpress-kidsPreschool.webp | 600×400 | 27744 |
| kidsReading | https://thrivevineyard.com/wp-content/uploads/2022/12/kids-reading-preschool_600x400-1.jpg | images/church/wordpress-kidsReading.webp | 600×400 | 25654 |
| kidsSchoolAge | https://thrivevineyard.com/wp-content/uploads/2022/12/boy-facial-expression-girl-2150606-1.jpg | images/church/wordpress-kidsSchoolAge.webp | 600×399 | 36912 |

## Verification and follow-up

- All 14 expected sources returned HTTP 200 with an image content type; Sharp decoded each input and output.
- `photos.ts` no longer contains a `wp-content` URL or temporary remote-image note.
- Gate: PASS on Node 22.16.0 (552 tests, typecheck, lint, production build). Initial local attempts under system Node 18 and an incomplete optional-dependency install failed; reinstalling optional dependencies under Node 22 resolved the toolchain errors.
- Cross-lane request to Data (#49): inventory and re-host any database-held `featured_image_url` WordPress values before cutover. Claude is handling that inventory separately.
- Cross-lane request to Ops: remove the `thrivevineyard.com/wp-content/uploads` image remote pattern only after all database-held URLs are migrated; otherwise existing records may break.
- The church domain has not been cut over. A network-blocked browser check on the integrated candidate remains a release verification step.
