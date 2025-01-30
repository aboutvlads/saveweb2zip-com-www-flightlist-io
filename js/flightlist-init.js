// Shared date range picker configuration
const sharedConfig = {
    drops: "down",
    applyClass: "btn-primary",
    alwaysShowCalendars: true
};

// Detect if mobile device
function isMobile() {
    return window.matchMedia("(max-width: 814px)").matches;
}

// Utility function for date range pickers
function setupDateRangePicker(elementId, initialStart, initialEnd, ranges, mobileOpens, customTemplate = null) {
    const $element = $(`#${elementId}`);
    
    function cb(start, end) {
        $element.find('span').html(`${start.format('MMM D')} - ${end.format('MMM D, YYYY')}`);
    }
    const config = {
        ...sharedConfig,
        startDate: initialStart,
        endDate: initialEnd,
        ranges: ranges,
        opens: isMobile() ? mobileOpens : 'center'
    };
    if (customTemplate) {
        config.template = customTemplate;
    }
    $element.daterangepicker(config, cb);
    cb(initialStart, initialEnd);
}

// Departure Date Range Picker
$(function() {
    const start = moment();
    const end = moment().add(29, 'days');
    const ranges = {
        'This Weekend': [moment().day(6), moment().day(7)],
        'Next 7 Days': [moment(), moment().add(6, 'days')],
        'Next 30 Days': [moment(), moment().add(29, 'days')],
        'Next 60 Days': [moment(), moment().add(59, 'days')],
        'Next 90 Days': [moment(), moment().add(89, 'days')],
        'Next 180 Days': [moment(), moment().add(179, 'days')]
    };
    setupDateRangePicker('deprange', start, end, ranges, 'left');
});

// Return Date Range Picker
$(function() {
    const start = moment().add(30, 'days');
    const end = moment().add(59, 'days');
    const ranges = {
        'Next Week': [moment().add(1, 'week').startOf('week'), moment().add(1, 'week').endOf('week')],
        'Next Weekend': [moment().add(1, 'week').day(6), moment().add(1, 'week').day(7)],
        'Next Month': [moment().add(1, 'month').startOf('month'), moment().add(1, 'month').endOf('month')],
        'After 2 Months': [moment().add(2, 'month').startOf('month'), moment().add(2, 'month').endOf('month')],
        'After 3 Months': [moment().add(3, 'month').startOf('month'), moment().add(3, 'month').endOf('month')],
        'After 6 Months': [moment().add(6, 'month').startOf('month'), moment().add(6, 'month').endOf('month')]
    };
    const customTemplate = `
        <div class="daterangepicker">
            <div class="drp-title-departure"><strong>Return Date Range</strong> (select range of dates to return)</div>
            <div class="ranges"></div>
            <div class="drp-calendar left">
                <div class="calendar-table"></div>
                <div class="calendar-time"></div>
            </div>
            <div class="drp-calendar right">
                <div class="calendar-table"></div>
                <div class="calendar-time"></div>
            </div>
            <div class="drp-buttons">
                <button class="cancelBtn" type="button"></button>
                <button class="applyBtn" disabled="disabled" type="button"></button> 
            </div>
        </div>
    `;
    setupDateRangePicker('retrange', start, end, ranges, 'left', customTemplate);
});

// Initialize LazyLoad
(function() {
    function lazyLoadImages() {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const image = entry.target;
                    image.src = image.dataset.src;
                    image.classList.remove('lazy-load');
                    observer.unobserve(image);
                }
            });
        });

        document.querySelectorAll('img.lazy-load').forEach(img => {
            imageObserver.observe(img);
        });
    }

    // Run immediately if the DOM is already loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', lazyLoadImages);
    } else {
        lazyLoadImages();
    }

    // Also run on window load to catch any late additions
    window.addEventListener('load', lazyLoadImages);
})();

// Service Worker for PWA
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/serviceWorker.js");
    });
}