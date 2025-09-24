/**
 * Laapak Report System - Child-Friendly Report Enhancements
 * This script adds interactive and child-friendly elements to the report page
 */

document.addEventListener('DOMContentLoaded', function() {
    // Create welcome card as Step 0
    createWelcomeCard();
    
    // Add floating guide button
    addFloatingGuideButton();
    
    // Initialize animations
    initAnimations();
    
    // Add emoji reactions
    addEmojiReactions();
    
    // Initialize progress bars animation
    initProgressBars();
    
    // Enhance walkthrough experience
    enhanceWalkthrough();
    
    // Add tooltips to technical terms
    addSimpleTooltips();
    
    // Initialize step navigation
    initStepNavigation();
});

/**
 * Add a floating button to toggle the walkthrough guide
 */
function addFloatingGuideButton() {
    // Create the floating button
    const floatingButton = document.createElement('button');
    floatingButton.className = 'btn btn-primary rounded-circle shadow position-fixed animate__animated animate__pulse animate__infinite animate__slower';
    floatingButton.id = 'guideToggleBtn';
    floatingButton.style = 'bottom: 20px; right: 20px; width: 60px; height: 60px; z-index: 1000;';
    floatingButton.innerHTML = '<i class="fas fa-map-marked-alt fa-2x"></i>';
    floatingButton.title = 'افتح دليل التقرير';
    
    // Add the button to the body
    document.body.appendChild(floatingButton);
    
    // Add click event listener
    floatingButton.addEventListener('click', function() {
        toggleGuide();
    });
}

/**
 * Toggle button functionality - scrolls to the top of the page
 */
function toggleGuide() {
    // Get the first section or the top of the page
    const firstSection = document.querySelector('#general-info') || document.body;
    
    // Add a highlight animation to the first section
    if (firstSection.id) {
        firstSection.classList.add('highlight-section');
        
        // Remove the highlight after animation completes
        setTimeout(() => {
            firstSection.classList.remove('highlight-section');
        }, 2000);
    }
    
    // Scroll to the top of the page with smooth animation
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
    
    // Add a small animation to the button when clicked
    const toggleBtn = document.getElementById('guideToggleBtn');
    if (toggleBtn) {
        toggleBtn.classList.remove('animate__pulse', 'animate__infinite');
        toggleBtn.classList.add('animate__bounce');
        
        // Reset the button animation after a short delay
        setTimeout(() => {
            toggleBtn.classList.remove('animate__bounce');
            toggleBtn.classList.add('animate__pulse', 'animate__infinite');
        }, 1000);
    }
}

/**
 * Create welcome card as Step 0
 */
// function createWelcomeCard() {
//     // Remove any existing welcome card
//     const existingCard = document.getElementById('welcome-card');
//     if (existingCard) {
//         existingCard.remove();
//     }
    
//     // Create a new welcome card
//     const welcomeCard = document.createElement('div');
//     welcomeCard.className = 'card mb-4 shadow animate__animated animate__fadeIn';
//     welcomeCard.id = 'welcome-card';
//     // welcomeCard.innerHTML = `
//     //     
//     // `;
    
//     // Hide the card by default
//     welcomeCard.classList.add('d-none');
    
//     // Insert the welcome card into the page
//     const container = document.querySelector('.container.py-4');
//     if (container) {
//         container.insertBefore(welcomeCard, container.firstChild);
//     }
// }

/**
 * Initialize animations for elements
 */
function initAnimations() {
    // Add entrance animations with delay
    const animatedElements = document.querySelectorAll('.card:not(.child-walkthrough)');
    animatedElements.forEach((element, index) => {
        if (!element.classList.contains('animate__animated')) {
            element.classList.add('animate__animated', 'animate__fadeIn');
            element.style.animationDelay = (index * 0.2) + 's';
        }
    });
    
    // Add pulse animation to important elements
    const importantElements = document.querySelectorAll('.status-badge-great');
    importantElements.forEach(element => {
        element.classList.add('animate__animated', 'animate__pulse', 'animate__infinite', 'animate__slower');
    });
}

/**
 * Add emoji reactions to component cards
 */
function addEmojiReactions() {
    const componentCards = document.querySelectorAll('.component-card');
    
    componentCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            const emoji = this.querySelector('.emoji-status');
            if (emoji) {
                emoji.classList.add('animate__animated', 'animate__bounce');
            }
        });
        
        card.addEventListener('mouseleave', function() {
            const emoji = this.querySelector('.emoji-status');
            if (emoji) {
                emoji.classList.remove('animate__animated', 'animate__bounce');
            }
        });
    });
}

/**
 * Initialize progress bars with animation
 */
function initProgressBars() {
    const progressBars = document.querySelectorAll('.fun-progress-bar');
    
    // Animate progress bars on scroll
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const bar = entry.target;
                const targetWidth = bar.style.width;
                
                // Reset width to 0
                bar.style.width = '0%';
                
                // Animate to target width
                setTimeout(() => {
                    bar.style.width = targetWidth;
                }, 200);
                
                // Unobserve after animation
                observer.unobserve(bar);
            }
        });
    }, { threshold: 0.2 });
    
    // Observe all progress bars
    progressBars.forEach(bar => {
        observer.observe(bar);
    });
}

/**
 * Enhance the walkthrough experience
 */
function enhanceWalkthrough() {
    // Convert step indicators to child-friendly style
    const stepIndicators = document.querySelectorAll('.step-indicator');
    stepIndicators.forEach(indicator => {
        indicator.classList.add('child-step-indicator');
    });
    
    // Add fun descriptions to steps
    updateStepDescriptions();
    
    // Make the walkthrough container more noticeable
    const walkthroughContainer = document.querySelector('.walkthrough-container');
    if (walkthroughContainer) {
        setTimeout(() => {
            walkthroughContainer.classList.add('animate__animated', 'animate__heartBeat');
            setTimeout(() => {
                walkthroughContainer.classList.remove('animate__heartBeat');
            }, 1500);
        }, 2000);
    }
}

/**
 * Update step descriptions to be more child-friendly
 */
function updateStepDescriptions() {
    // Override the original updateStepDescription function if it exists
    if (window.updateStepDescription) {
        const originalUpdateStepDescription = window.updateStepDescription;
        
        window.updateStepDescription = function(stepIndex) {
            const stepDescription = document.getElementById('stepDescription');
            if (!stepDescription) return;
            
            const childFriendlyDescriptions = [
                "مرحباً! هنا ستجد معلومات عامة عن جهازك الجديد! 👋",
                "هنا نتأكد أن كل ما يمكنك رؤيته ولمسه في جهازك يعمل بشكل ممتاز! 👀",
                "هنا نتأكد أن كل الأجزاء الداخلية في جهازك تعمل بشكل ممتاز! 💻",
                "هنا نعرض لك صور جهازك الجديد من كل الجوانب! 📷",
                "هنا نقدم لك نصائح للعناية بجهازك الجديد! 🌟"
            ];
            
            if (stepIndex < childFriendlyDescriptions.length) {
                stepDescription.innerHTML = `
                    <div class="simple-explanation mb-0">
                        <div class="simple-explanation-title">
                            <i class="fas fa-map-marker-alt"></i> الخطوة ${stepIndex + 1}
                        </div>
                        <p class="mb-0">${childFriendlyDescriptions[stepIndex]}</p>
                    </div>
                `;
                return;
            }
            
            // Fall back to original function if no child-friendly description is available
            originalUpdateStepDescription(stepIndex);
        };
    }
}

/**
 * Add tooltips to technical terms
 */
function addSimpleTooltips() {
    const technicalTerms = {
        'المعالج': 'المعالج هو "عقل" جهازك! يقوم بكل العمليات الحسابية ويجعل جهازك يعمل بسرعة',
        'الذاكرة': 'الذاكرة هي المكان الذي يحفظ فيه جهازك البرامج التي تستخدمها حالياً',
        'البطارية': 'البطارية هي التي تعطي الطاقة لجهازك عندما لا يكون موصولاً بالكهرباء',
        'كرت الشاشة': 'كرت الشاشة هو المسؤول عن عرض الصور والألعاب بشكل جميل وسريع',
        'الرقم التسلسلي': 'الرقم التسلسلي هو مثل "بصمة الإصبع" لجهازك، يميزه عن كل الأجهزة الأخرى',
        'الواي فاي': 'الواي فاي يسمح لجهازك بالاتصال بالإنترنت بدون أسلاك',
        'البلوتوث': 'البلوتوث يسمح لجهازك بالاتصال بأجهزة أخرى قريبة مثل السماعات اللاسلكية'
    };
    
    // Find all technical terms in the document
    for (const term in technicalTerms) {
        const elements = document.querySelectorAll('p, h5, span, div.component-name');
        elements.forEach(element => {
            if (element.innerHTML.includes(term) && !element.querySelector('.tooltip-added')) {
                const newHTML = element.innerHTML.replace(
                    new RegExp(`(${term})`, 'g'), 
                    `<span class="technical-term tooltip-added" data-bs-toggle="tooltip" data-bs-placement="top" title="${technicalTerms[term]}">$1</span>`
                );
                element.innerHTML = newHTML;
            }
        });
    }
    
    // Initialize Bootstrap tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

/**
 * Add confetti celebration when the report is fully loaded
 */
function celebrateReportLoaded() {
    // Add confetti effect (requires confetti.js library)
    if (window.confetti) {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    }
}

// Celebrate after everything is loaded
window.addEventListener('load', function() {
    setTimeout(celebrateReportLoaded, 1500);
});
