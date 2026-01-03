(function () {
    console.log("[TYPING] Custom script loading...");

    // Wait for the theme's TypeIt to fail, then initialize ours
    function initCustomTyped() {
        console.log("[TYPING] Initializing custom typing effect...");
        const typedEl = document.getElementById("typed");
        const dataEl = document.getElementById("typing-carousel-data");

        if (!typedEl || !dataEl) {
            console.error("[TYPING] Elements not found!", { typedEl, dataEl });
            return;
        }

        const strings = Array.from(dataEl.querySelectorAll("li")).map(li => li.textContent.trim());
        console.log("[TYPING] Found strings:", strings);

        if (strings.length === 0) {
            console.error("[TYPING] No strings found!");
            return;
        }

        // Clear any existing content
        typedEl.innerHTML = '';

        try {
            console.log("[TYPING] Creating TypeIt instance...");
            const instance = new TypeIt(typedEl, {
                strings: strings,
                speed: 50,
                startDelay: 500,
                loop: true,
                cursor: true,
                breakLines: true,
                nextStringDelay: 1000,
                lifeLike: true
            });

            instance.go();
            console.log("[TYPING] TypeIt started successfully!");
        } catch (err) {
            console.error("[TYPING] TypeIt failed:", err);
        }
    }

    // Wait for TypeIt library to be available (loaded by theme)
    function waitForTypeIt() {
        if (typeof TypeIt !== 'undefined') {
            console.log("[TYPING] TypeIt library found!");
            // Wait a bit for theme's script to fail, then run ours
            setTimeout(initCustomTyped, 500);
        } else {
            console.log("[TYPING] Waiting for TypeIt library...");
            setTimeout(waitForTypeIt, 100);
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", waitForTypeIt);
    } else {
        waitForTypeIt();
    }
})();
