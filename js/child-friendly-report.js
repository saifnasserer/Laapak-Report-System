/**
 * Laapak Report System - Child-Friendly Report Enhancements
 * This script adds interactive and child-friendly elements to the report page
 */

document.addEventListener('DOMContentLoaded', function() {
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
});

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
