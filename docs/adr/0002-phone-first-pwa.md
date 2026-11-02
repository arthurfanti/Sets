# Phone-first PWA, no native build

The app ships as a web app installed to the home screen, laid out for one-handed phone use, with no App Store or Play Store distribution and no native wrapper. This keeps the build to one codebase and one deploy target. The cost is real: no HealthKit/Health Connect access, no reliable background timers on iOS, and a PWA that can be evicted from storage — accepted because the v1 scope excludes wearable sync and ships no export, so history durability is knowingly traded away. Recorded so a future reader does not assume native was simply overlooked.
