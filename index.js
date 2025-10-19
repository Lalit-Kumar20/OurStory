// Reveal-on-scroll script

let refreshCounter = 0;

(function() {
    // Clear cache on page load
    window.addEventListener('load', () => {
        refreshCounter = refreshCounter+1;
        console.log(refreshCounter);
        if(refreshCounter>2){
            sessionStorage.clear();
            localStorage.clear();
            if (caches) {
            caches.keys().then((names) => {
                names.forEach(name => {
                    caches.delete(name);
                });
            });
        }
        }
    });

    const reveals = Array.from(document.querySelectorAll('.reveal'));
    if (!('IntersectionObserver' in window) || reveals.length === 0) {
        reveals.forEach(r => r.classList.add('visible'));
        return;
    }

    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                io.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    reveals.forEach(r => io.observe(r));
})();

// Carousel script
(function() {
    const carousel = document.querySelector('.carousel');
    if (!carousel) return;

    const track = carousel.querySelector('.carousel-track');
    const slides = Array.from(carousel.querySelectorAll('.carousel-slide'));
    const prevBtn = carousel.querySelector('.carousel-btn.prev');
    const nextBtn = carousel.querySelector('.carousel-btn.next');
    const dots = Array.from(carousel.querySelectorAll('.carousel-dot'));
    let index = 0;
    let autoplayInterval = null;
    const AUTOPLAY_MS = 4000;
  
    function update() {
        const offset = -index * 100;
        track.style.transform = `translateX(${offset}%)`;
        dots.forEach((d,i) => d.classList.toggle('active', i === index));
    }

    function goTo(i) {
        index = (i + slides.length) % slides.length;
        update();
    }

    prevBtn.addEventListener('click', () => { goTo(index - 1); restartAutoplay(); });
    nextBtn.addEventListener('click', () => { goTo(index + 1); restartAutoplay(); });

    dots.forEach((dot, i) => {
        dot.addEventListener('click', () => { goTo(i); restartAutoplay(); });
    });

    carousel.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') { goTo(index - 1); restartAutoplay(); }
        if (e.key === 'ArrowRight') { goTo(index + 1); restartAutoplay(); }
    });
    carousel.tabIndex = 0;

    function startAutoplay() {
        stopAutoplay();
        autoplayInterval = setInterval(() => { goTo(index + 1); }, AUTOPLAY_MS);
    }
    function stopAutoplay() {
        if (autoplayInterval) { clearInterval(autoplayInterval); autoplayInterval = null; }
    }
    function restartAutoplay() { stopAutoplay(); startAutoplay(); }

    carousel.addEventListener('mouseenter', stopAutoplay);
    carousel.addEventListener('focusin', stopAutoplay);
    carousel.addEventListener('mouseleave', startAutoplay);
    carousel.addEventListener('focusout', startAutoplay);

    update();
    startAutoplay();
})();

// OTP Verification script
(function() {
    const correctOtp = '';
    const overlay = document.getElementById('otpOverlay');
    const input = document.getElementById('otpInput');
    const submitBtn = document.getElementById('submitOtp');
    const errorMsg = document.getElementById('otpError');

    if (!overlay || !input || !submitBtn || !errorMsg) return;

    // Start locked on load
    document.body.classList.remove('authenticated');
    showOverlay();

    submitBtn.addEventListener('click', verifyOtp);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') verifyOtp();
    });

    function showOverlay() {
        overlay.classList.add('open');    // use class, not inline style
        input.value = '';
        input.focus();
        errorMsg.textContent = '';
    }

    function hideOverlay() {
        overlay.classList.remove('open'); // use class, not inline style
        errorMsg.textContent = '';
    }

    function verifyOtp() {
        const enteredOtp = input.value.trim();
        if (enteredOtp === correctOtp) {
            document.body.classList.add('authenticated');
            hideOverlay();
        } else {
            errorMsg.textContent = 'Incorrect code. Please try again.';
            input.value = '';
            input.focus();
        }
    }
})();

document.addEventListener('DOMContentLoaded', function () {
    const emailInput = document.getElementById('emailInput');
    const phoneInput = document.getElementById('phoneInput');
    const nextBtn = document.getElementById('nextToOtp');
    const step1Error = document.getElementById('step1Error');

    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const otpInput = document.getElementById('otpInput');
    const submitOtp = document.getElementById('submitOtp');
    const backToStep1 = document.getElementById('backToStep1');
    const step2Error = document.getElementById('step2Error');

    // If any required element is missing, stop to avoid rendering text or errors
    if (!emailInput || !phoneInput || !nextBtn || !step1 || !step2 || !otpInput || !submitOtp || !backToStep1) {
        console.warn('Auth script: missing elements, initialization aborted.');
        return;
    }

    let currentOtp = null;

    const validateEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const validatePhone = phone => /^[0-9]{10}$/.test(phone);

    function sendOtpTo(email, phone) {
        // POST request to send OTP
        fetch('https://node-otp-two.vercel.app/otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: email, phone: phone })
        })
        .then(response => response.json())
        .then(data => {
            currentOtp = data.otp; // Assuming the response contains the OTP
           // console.info('OTP sent:', currentOtp);
        })
        .catch(error => {
            console.error('Error sending OTP:', error);
        });
        //currentOtp = '1234'; // For demo purposes, fixed OTP
    }

    nextBtn.addEventListener('click', function () {
        step1Error.textContent = '';
        const email = (emailInput.value || '').trim();
        const phone = (phoneInput.value || '').trim();

        if (!validateEmail(email)) {
            step1Error.textContent = 'Enter a valid email.';
            emailInput.focus();
            return;
        }
        if (!validatePhone(phone)) {
            step1Error.textContent = 'Enter a 10-digit phone number.';
            phoneInput.focus();
            return;
        }

        sendOtpTo(email, phone);

        step1.style.display = 'none';
        step2.style.display = 'block';
        otpInput.value = '';
        step2Error.textContent = '';
        otpInput.focus();
    });

    backToStep1.addEventListener('click', function () {
        step2.style.display = 'none';
        step1.style.display = 'block';
        step1Error.textContent = '';
        emailInput.focus();
    });

    function verifyOtp() {
        step2Error.textContent = '';
        const entry = (otpInput.value || '').trim();
        if (entry.length !== 4) {
            step2Error.textContent = 'Enter the 4-digit code.';
            otpInput.focus();
            return;
        }
        if (entry !== currentOtp) {
            step2Error.textContent = 'Incorrect code. Please try again.';
            otpInput.focus();
            return;
        }

        // success: reveal page
        document.body.classList.add('authenticated');
        currentOtp = null;
    }

    submitOtp.addEventListener('click', verifyOtp);

    // Enter key handling
    [emailInput, phoneInput].forEach(i =>
        i.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') { e.preventDefault(); nextBtn.click(); }
        })
    );
    otpInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); verifyOtp(); }
    });

    // initial focus
    if (!document.body.classList.contains('authenticated')) {
        emailInput.focus();
    }
});



   
 