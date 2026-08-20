/*
  Pengingat interaksi Neon Afterglow:
  Pergerakan harus terasa seperti film pribadi: ambien dan tidak terburu-buru untuk membangun suasana,
  singkat dan taktil untuk kontrol. Semua suara hanya dimulai setelah ketukan yang disengaja.
*/

(() => {
  "use strict";

  // --- Original DOM references ---
  const opening = document.getElementById("opening");
  const site = document.getElementById("site");
  const enterSite = document.getElementById("enterSite");
  const header = document.getElementById("siteHeader");
  const railFill = document.getElementById("railFill");
  const soundToggle = document.getElementById("soundToggle");
  const soundText = document.getElementById("soundText");
  const starfield = document.getElementById("starfield");
  const videoButton = document.getElementById("videoButton");
  const videoHint = document.getElementById("videoHint");
  const playMoment = document.getElementById("playMoment");
  const sendLove = document.getElementById("sendLove");
  const loveBurst = document.getElementById("loveBurst");
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  // --- NEW: Reference to the MP3 audio element & Real Video ---
  const audioElement = document.getElementById("ambientAudio");
  const realVideo = document.getElementById("realVideo");

  // --- Original createStars ---
  function createStars() {
    if (!starfield || reduceMotion) return;
    const fragment = document.createDocumentFragment();
    for (let index = 0; index < 46; index += 1) {
      const star = document.createElement("i");
      star.className = "star";
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 76}%`;
      star.style.setProperty("--duration", `${2.6 + Math.random() * 4.8}s`);
      star.style.animationDelay = `${Math.random() * -5}s`;
      fragment.appendChild(star);
    }
    starfield.appendChild(fragment);
  }

  // --- Original ambientMusic (Web Audio) ---
  const ambientMusic = (() => {
    let context;
    let masterGain;
    let scheduler;
    let isPlaying = false;
    let step = 0;
    const chords = [
      [220.0, 261.63, 329.63],
      [196.0, 246.94, 293.66],
      [174.61, 220.0, 261.63],
      [196.0, 233.08, 293.66],
    ];

    function makeTone(frequency, when, duration, volume, detune = 0) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const filter = context.createBiquadFilter();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      oscillator.detune.value = detune;
      filter.type = "lowpass";
      filter.frequency.value = 1100;
      gain.gain.setValueAtTime(0.0001, when);
      gain.gain.exponentialRampToValueAtTime(volume, when + 0.18);
      gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
      oscillator.connect(filter).connect(gain).connect(masterGain);
      oscillator.start(when);
      oscillator.stop(when + duration + 0.05);
    }

    function scheduleChord() {
      if (!isPlaying) return;
      const now = context.currentTime + 0.05;
      const chord = chords[step % chords.length];
      chord.forEach((note, index) => {
        makeTone(note, now + index * 0.1, 2.65, 0.038, index === 1 ? 5 : -4);
      });
      makeTone(chord[0] / 2, now, 2.8, 0.022);
      step += 1;
    }

    async function start() {
      if (isPlaying) return;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      context = context || new AudioContext();
      masterGain = masterGain || context.createGain();
      masterGain.connect(context.destination);
      masterGain.gain.setValueAtTime(0.0001, context.currentTime);

      if (context.state === "suspended") {
        await context.resume();
      }

      masterGain.gain.exponentialRampToValueAtTime(
        0.44,
        context.currentTime + 0.45,
      );
      isPlaying = true;
      scheduleChord();
      scheduler = window.setInterval(scheduleChord, 2700);
    }

    function stop() {
      if (!isPlaying || !context || !masterGain) return;
      isPlaying = false;
      window.clearInterval(scheduler);
      masterGain.gain.cancelScheduledValues(context.currentTime);
      masterGain.gain.setTargetAtTime(0.0001, context.currentTime, 0.18);
    }

    return {
      start,
      stop,
      get playing() {
        return isPlaying;
      },
    };
  })();

  // --- NEW: MP3 audio control helpers ---
  let mp3Playing = false;

  function playMp3() {
    if (!audioElement) return false;
    if (audioElement.src && audioElement.src !== "") {
      audioElement
        .play()
        .then(() => {
          mp3Playing = true;
          updateSoundToggleUI(true);
        })
        .catch((err) => {
          console.warn("MP3 playback failed, falling back to Web Audio.", err);
          // fallback to Web Audio
          ambientMusic.start().then(() => {
            mp3Playing = false;
            updateSoundToggleUI(ambientMusic.playing);
          });
        });
      return true;
    }
    return false;
  }

  function pauseMp3() {
    if (!audioElement) return;
    audioElement.pause();
    mp3Playing = false;
    updateSoundToggleUI(false);
  }

  function updateSoundToggleUI(isPlaying) {
    if (!soundToggle || !soundText) return;
    soundToggle.setAttribute("aria-pressed", isPlaying ? "true" : "false");
    soundToggle.setAttribute(
      "aria-label",
      isPlaying ? "Matikan musik ambien" : "Nyalakan musik ambien",
    );
    soundText.textContent = isPlaying ? "Suara nyala" : "Nyalakan Suara";
  }

  // --- Modified toggleMusic (original logic preserved + MP3 integration) ---
  async function toggleMusic() {
    try {
      // Check if MP3 is available and playable
      if (audioElement && audioElement.src && audioElement.src !== "") {
        if (mp3Playing) {
          pauseMp3();
          // Also stop Web Audio if it was running
          if (ambientMusic.playing) ambientMusic.stop();
        } else {
          // Try MP3 first
          const success = playMp3();
          if (!success) {
            // fallback to Web Audio
            await ambientMusic.start();
            mp3Playing = false;
            updateSoundToggleUI(ambientMusic.playing);
          }
        }
        return;
      }

      // No MP3, use original Web Audio
      if (ambientMusic.playing) {
        ambientMusic.stop();
        mp3Playing = false;
        updateSoundToggleUI(false);
      } else {
        await ambientMusic.start();
        if (!ambientMusic.playing) return;
        mp3Playing = false;
        updateSoundToggleUI(true);
      }
    } catch (error) {
      soundText.textContent = "Suara tidak tersedia";
      console.warn("Suara ambien tidak dapat dimulai.", error);
    }
  }

  // --- FIXED revealSite: handles opening removal + aria cleanup ---
  function revealSite() {
    console.log("revealSite triggered"); // for debugging
    if (!opening || opening.classList.contains("is-hidden")) return;

    // Hide opening
    opening.classList.add("is-hidden");
    opening.setAttribute("aria-hidden", "true");
    opening.removeAttribute("aria-modal");

    // Show main site
    if (site) {
      site.setAttribute("aria-hidden", "false");
      site.classList.add("is-visible");
    }

    // Remove opening from DOM after transition
    window.setTimeout(() => {
      if (opening) opening.remove();
    }, 780);
  }

  // --- Original updateScrollState ---
  function updateScrollState() {
    const top = window.scrollY;
    const scrollable = Math.max(
      document.documentElement.scrollHeight - window.innerHeight,
      1,
    );
    const progress = Math.min(100, Math.max(0, (top / scrollable) * 100));
    if (railFill) railFill.style.height = `${progress}%`;
    if (header) header.classList.toggle("is-scrolled", top > 24);
  }

  // --- Original setupReveals ---
  function setupReveals() {
    const items = document.querySelectorAll(".reveal");
    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    items.forEach((item) => observer.observe(item));
  }

  // --- setupCarousel (improved to read exact CSS gap) ---
  function setupCarousel() {
    const track = document.getElementById("carouselTrack");
    const prevBtn = document.getElementById("carouselPrev");
    const nextBtn = document.getElementById("carouselNext");
    let currentIndex = 0;

    if (!track || !prevBtn || !nextBtn) return;

    const cards = track.querySelectorAll(".memory-card");

    function updateCarouselPosition() {
      if (currentIndex === 0) {
        track.style.transform = "";
        return;
      }

      const cardWidth = track.querySelector(".memory-card")?.offsetWidth || 0;
      // Dynamically grabs the actual gap set in CSS to ensure flawless sliding calculation
      const computedGap = window.getComputedStyle(track).columnGap;
      const gap = computedGap === "normal" ? 0 : parseFloat(computedGap) || 0;

      const shift = currentIndex * (cardWidth + gap);
      track.style.transform = `translateX(-${shift}px)`;
    }

    prevBtn.addEventListener("click", () => {
      if (currentIndex > 0) {
        currentIndex--;
        updateCarouselPosition();
      }
    });

    nextBtn.addEventListener("click", () => {
      if (currentIndex < cards.length - 1) {
        currentIndex++;
        updateCarouselPosition();
      }
    });

    const resetCarousel = () => {
      currentIndex = 0;
      updateCarouselPosition();
    };
    window.addEventListener("resize", resetCarousel);
    window.addEventListener("load", () => {
      updateCarouselPosition();
    });
  }

  // --- Original showVideoHint ---
  function showVideoHint() {
    if (videoHint) {
      videoHint.classList.add("is-visible");
      window.setTimeout(() => videoHint.classList.remove("is-visible"), 3200);
    }
  }

  // --- Original burstLove ---
  function burstLove() {
    if (!loveBurst) return;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const fragment = document.createDocumentFragment();

    for (let index = 0; index < 28; index += 1) {
      const particle = document.createElement("i");
      const angle = (Math.PI * 2 * index) / 28 + (Math.random() - 0.5) * 0.35;
      const distance = 90 + Math.random() * Math.min(window.innerWidth, 330);

      particle.className = "heart-particle";
      particle.textContent = index % 3 === 0 ? "✦" : "♡";
      particle.style.left = `${centerX + (Math.random() - 0.5) * 50}px`;
      particle.style.top = `${centerY + (Math.random() - 0.5) * 35}px`;
      particle.style.setProperty("--x", `${Math.cos(angle) * distance}px`);
      particle.style.setProperty("--y", `${Math.sin(angle) * distance}px`);
      particle.style.setProperty("--r", `${(Math.random() - 0.5) * 150}deg`);

      fragment.appendChild(particle);
      window.setTimeout(() => particle.remove(), 1650);
    }
    loveBurst.appendChild(fragment);
  }

  // --- Inisialisasi semua fungsi utama ---
  createStars();
  setupReveals();
  updateScrollState();
  setupCarousel();

  // --- Event Listeners ---
  // enterSite: now uses the enhanced revealSite
  if (enterSite) enterSite.addEventListener("click", revealSite);

  // soundToggle
  if (soundToggle) soundToggle.addEventListener("click", toggleMusic);

  window.addEventListener("scroll", updateScrollState, { passive: true });

  // --- LOGIKA VIDEO DITAMBAHKAN DI SINI ---
  if (videoButton && realVideo) {
    videoButton.addEventListener("click", () => {
      if (realVideo.paused) {
        realVideo.style.opacity = "1";
        realVideo.play();
        videoButton.innerHTML = "<span>⏸</span>";
      } else {
        realVideo.pause();
        videoButton.innerHTML = "<span>▶</span>";
      }
    });
  } else if (videoButton) {
    // Fallback original
    videoButton.addEventListener("click", showVideoHint);
  }

  if (playMoment) {
    playMoment.addEventListener("click", () => {
      const reelSection = document.querySelector(".reel");
      if (reelSection) {
        reelSection.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }

  if (sendLove) sendLove.addEventListener("click", burstLove);

  // --- Audio element event listeners for UI sync ---
  if (audioElement) {
    audioElement.addEventListener("ended", () => {
      mp3Playing = false;
      updateSoundToggleUI(false);
    });
    audioElement.addEventListener("play", () => {
      mp3Playing = true;
      updateSoundToggleUI(true);
    });
    audioElement.addEventListener("pause", () => {
      mp3Playing = false;
      updateSoundToggleUI(false);
    });
    audioElement.addEventListener("error", () => {
      console.warn("MP3 audio error, Web Audio will be used as fallback.");
    });
  }

  // --- Extra guard: double-click protection for sound toggle ---
  if (soundToggle) {
    let toggling = false;
    soundToggle.addEventListener(
      "click",
      function (e) {
        if (toggling) {
          e.stopImmediatePropagation();
          return;
        }
        toggling = true;
        setTimeout(() => {
          toggling = false;
        }, 400);
      },
      true,
    ); // capture phase
  }

  console.log("✅ All interactive elements are now clickable and secure.");
})();
