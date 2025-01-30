// External variables
// arrayAirlines is defined in airlines.js

// Global variables
let airlineDictionary = {};
let currencySymbolMap;

// Utility functions
function encodeQueryData(data) {
    return Object.keys(data)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
        .join('&');
}

function safeGetValue(elementId) {
    const element = document.getElementById(elementId);
    return element ? element.value : '';
}

function formatDate(date) {
    return date.format('DD/MM/YYYY');
}

function formatPrice(price) {
    const numPrice = parseFloat(price);
    const priceString = numPrice.toFixed(2);
    const [wholePart, decimalPart] = priceString.split('.');
    
    if (parseInt(decimalPart) <= 9) {
        return wholePart;
    } else {
        return priceString;
    }
}

function getSelectedOptionData(selectId, dataAttribute) {
    const select = document.getElementById(selectId);
    return select && select.selectedOptions.length > 0 ? select.selectedOptions[0].dataset[dataAttribute] : '';
}

function getTotalDuration(routes) {
    const start = moment(new Date(routes[0].utc_departure));
    const end = moment(new Date(routes[routes.length - 1].utc_arrival));
    const duration = moment.duration(end.diff(start));
    const hours = Math.floor(duration.asHours());
    const minutes = duration.minutes();
    return `${hours}h ${minutes}m`;
}

function getDurationText(route) {
    const duration = moment(new Date(route.utc_arrival)).diff(moment(new Date(route.utc_departure)), 'minutes');
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return `${hours}h ${minutes}m`;
}

function getStopsText(routes) {
    const stops = routes.length - 1;
    if (stops === 0) return "Direct";
    if (stops === 1) return "1 Stop";
    return `${stops} Stops`;
}

function createAirlineLogo(airlines) {
    return airlines.map(airline => {
        const airlineName = String(arrayAirlines.find(k => k.id === airline)?.name);
        return `<img class="rounded mr-1 lazy-load" src="/img/placeholder.png" data-src="https://images.kiwi.com/airlines/32/${airline}.png" title="${airlineName}" alt="${airlineName}" />`;
    }).join('');
}

function createRoutesSection(routes) {
    let routesSection = '';
    let outboundEnded = false;

    routes.forEach((route, index) => {
        const htmlForRoute = createRouteHtml(route);
        let layoverOrStayHtml = '';
        
        if (index < routes.length - 1) {
            if (!outboundEnded && routes[index + 1].return === 1) {
                layoverOrStayHtml = createStayHtml(route, routes[index + 1]);
                outboundEnded = true;
            } else {
                layoverOrStayHtml = createLayoverHtml(route, routes[index + 1]);
            }
        }
        
        routesSection += htmlForRoute + layoverOrStayHtml;

        const airlineName = arrayAirlines.find(airline => airline.id === route.airline)?.name;
        if (airlineName) {
            airlineDictionary[route.airline] = airlineName;
        }
    });
    return routesSection;
}

function createRouteHtml(route) {
    const airlineName = arrayAirlines.find(airline => airline.id === route.airline)?.name;
    return `
        <div class="route small card mt-3 mb-3">
            <div class="card-block">
                <p class="mb-0">
                    <i class="fa fa-calendar" aria-hidden="true"></i> ${moment(new Date(route.local_departure)).utc().format("ddd MMM Do YYYY")}
                    <i class="fa fa-plane ml-2" aria-hidden="true"></i> ${airlineName}
                    <span class="text-muted">&middot; ${route.airline} ${route.flight_no}</span>
                    <i class="fa fa-map-marker ml-2" aria-hidden="true"></i> Depart at ${moment(new Date(route.local_departure)).utc().format("h:mma")} from ${route.cityFrom} (${route.flyFrom})
                    <i class="fa fa-clock-o ml-2" aria-hidden="true"></i> Fly for ${getDurationText(route)}
                    <i class="fa fa-map-marker ml-2" aria-hidden="true"></i> Arrive at ${moment(new Date(route.local_arrival)).utc().format("h:mma")} in ${route.cityTo} (${route.flyTo})
                </p>
            </div>
        </div>
    `;
}

function createLayoverHtml(currentRoute, nextRoute) {
    const layoverDuration = moment(new Date(nextRoute.utc_departure)).diff(moment(new Date(currentRoute.utc_arrival)), 'minutes');
    const hours = Math.floor(layoverDuration / 60);
    const minutes = layoverDuration % 60;
    return `
        <div class="layover text-center small">
            <p class="mb-0">Layover in ${currentRoute.cityTo} for ${hours}h ${minutes}m</p>
        </div>
    `;
}

function createStayHtml(outboundRoute, inboundRoute) {
    const stayDuration = moment(new Date(inboundRoute.utc_departure)).diff(moment(new Date(outboundRoute.utc_arrival)), 'days');
    return `
        <div class="stay text-center small">
            <p class="mb-0">Stay in ${outboundRoute.cityTo} for ${stayDuration} night${stayDuration !== 1 ? 's' : ''} — find accommodations with <a href="https://www.kayak.com/in?a=kan_316339_592442&lc=en&url=%2Fhotels-dateless%2F${outboundRoute.cityTo}" target="_blank" rel="nofollow">Kayak</a> and <a href="https://www.awin1.com/cread.php?awinmid=6776&awinaffid=1677685&p=https://www.booking.com/searchresults.html?ss=${outboundRoute.cityTo}" target="_blank" rel="nofollow">Booking</a></p>
        </div>
    `;
}

function formatBagData(numberOfPassengers, numberOfBags, maxBagsPerPassenger) {
    let bagData = [];
    let remainingBags = numberOfBags;

    for (let i = 0; i < numberOfPassengers; i++) {
        if (remainingBags > 0) {
            bagData.push(Math.min(remainingBags, maxBagsPerPassenger));
            remainingBags -= maxBagsPerPassenger;
        } else {
            bagData.push(0);
        }
    }

    return bagData.join(',');
}

function createCurrencySymbolMap() {
    const currencySelect = document.getElementById('currency');
    const symbolMap = {};
    
    for (const option of currencySelect.options) {
        symbolMap[option.value] = option.dataset.symbol;
    }
    
    return symbolMap;
}

function getCurrencySymbol(currencyCode) {
    return currencySymbolMap[currencyCode] || currencyCode;
}

// Generate Google Flights URL
function generateGoogleFlightsUrl(routes) {
    const outboundRoutes = routes.filter(route => route.return === 0);
    const inboundRoutes = routes.filter(route => route.return === 1);
    
    // Base URL
    let url = 'https://www.google.com/travel/flights/search';
    
    // Create the TFS parameter based on fast-flights format
    let tfs = 'CBwQAhoeEgo';  // Common prefix
    
    // Add outbound flight data
    const outboundDate = moment(new Date(outboundRoutes[0].local_departure)).format('YYYY-MM-DD');
    const fromAirport = outboundRoutes[0].flyFrom;
    const toAirport = outboundRoutes[outboundRoutes.length - 1].flyTo;
    
    // Encode flight data
    tfs += btoa(`${outboundDate}${fromAirport}${toAirport}`).replace(/=/g, '');
    
    if (inboundRoutes.length > 0) {
        // Round trip - add return flight data
        const inboundDate = moment(new Date(inboundRoutes[0].local_departure)).format('YYYY-MM-DD');
        tfs += 'Gh4SCg';  // Return flight prefix
        tfs += btoa(`${inboundDate}${inboundRoutes[0].flyFrom}${inboundRoutes[inboundRoutes.length - 1].flyTo}`).replace(/=/g, '');
        tfs += 'QAFIAXABggELCP___________wGYAQE';  // Round trip suffix
    } else {
        // One way
        tfs += 'QAFIAXABggELCP___________wGYAQA';  // One way suffix
    }
    
    return `${url}?tfs=${tfs}`;
}

// Events listener
document.addEventListener('DOMContentLoaded', () => {
    // Constants and configurations
    const API_KEY = 'FENuirN6cHfnRL2Vu2cxVWEtGTrZVHEY';
    const API_URL = 'https://api.tequila.kiwi.com/v2/search?';

    // Cache DOM elements
    const form = document.querySelector('form');
    const submitButton = document.getElementById('submit');
    const fromInput = document.getElementById('from-data');
    const toInput = document.getElementById('to-data');
    //const excludeInput = document.getElementById('exclude-data');
    const typeSelect = document.getElementById('type');
    const depRangeDiv = document.getElementById('deprange');
    const retRangeDiv = document.getElementById('retrange');
    const adultsInput = document.getElementById('adults');
    const childrenInput = document.getElementById('children');
    const cabinsSelect = document.getElementById('cabins');
    const currencySelect = document.getElementById('currency');
    const limitSelect = document.getElementById('limit');
    const sortSelect = document.getElementById('sort');
    const stopsSelect = document.getElementById('stops');
    const budgetInput = document.getElementById('budget');
    const durationInput = document.getElementById('duration');
    const layoverInput = document.getElementById('layover');
    const departTimeSelect = document.getElementById('departtime');
    const connectionsSelect = document.getElementById('connections');
    const airlineFilterSelect = document.getElementById('airlinefilter');
    const cabinBagsSelect = document.getElementById('cabinbags');
    const checkedBagsSelect = document.getElementById('checkedbags');
    const resultsContainer = document.getElementById('results');

    // Event listeners
    submitButton.addEventListener('click', handleFormSubmit);
    currencySymbolMap = createCurrencySymbolMap();

    // Main form submission handler
    function handleFormSubmit(event) {
        if (event) event.preventDefault();
        
        // Reset airline dictionary and filter only on new search
        airlineDictionary = {};
        
        const searchData = collectFormData();
        fetchFlights(searchData);
    }

    // Collect form data
    function collectFormData() {
        const flightType = safeGetValue('type');
        const adults = parseInt(adultsInput.value) || 1;
        const children = parseInt(childrenInput.value) || 0;

        const cabinBags = parseInt(safeGetValue('cabinbags')) || 0;
        const checkedBags = parseInt(safeGetValue('checkedbags')) || 0;

        // Distribute bags between adults and children
        const adultCabinBags = Math.min(cabinBags, adults);
        const childCabinBags = Math.max(0, cabinBags - adultCabinBags);

        const adultCheckedBags = Math.min(checkedBags, adults * 2);
        const childCheckedBags = Math.max(0, checkedBags - adultCheckedBags);

        const data = {
            fly_from: safeGetValue('from-data') || document.getElementById('countryip')?.textContent || '',
            fly_to: safeGetValue('to-data'),
            date_from: formatDate($('#deprange').data('daterangepicker').startDate),
            date_to: formatDate($('#deprange').data('daterangepicker').endDate),
            adults: adults.toString(),
            children: children.toString(),
            infants: safeGetValue('infants') || '0',
            selected_cabins: safeGetValue('class') || 'M',
            curr: safeGetValue('currency') || 'USD',
            price_to: safeGetValue('budget') || '',
            limit: safeGetValue('limit') || '100',
            sort: safeGetValue('sort') || 'price',
            max_stopovers: safeGetValue('stops') || '',
            max_fly_duration: safeGetValue('duration') || '',
            stopover_from: "00:00",
            stopover_to: `${safeGetValue('layover') || '48'}:00`,
            ret_from_diff_city: false,
            ret_to_diff_city: false,
            dtime_from: getSelectedOptionData('departtime', 'from') || '',
            dtime_to: getSelectedOptionData('departtime', 'to') || '',
            enable_vi: safeGetValue('connections') || '',
            flight_type: flightType,
            adult_hand_bag: formatBagData(adults, adultCabinBags, 1),
            adult_hold_bag: formatBagData(adults, adultCheckedBags, 2),
            child_hand_bag: children > 0 ? formatBagData(children, childCabinBags, 1) : undefined,
            child_hold_bag: children > 0 ? formatBagData(children, childCheckedBags, 2) : undefined
        };

        if (flightType === 'return') {
            data.return_from = formatDate($('#retrange').data('daterangepicker').startDate);
            data.return_to = formatDate($('#retrange').data('daterangepicker').endDate);
        }

        // Remove undefined properties
        Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

        return data;
    }

    // Fetch flights data from API
    function fetchFlights(data) {
        showLoading();
        const queryString = encodeQueryData(data);
        const url = `${API_URL}${queryString}`;

        //console.log('Request URL:', url);
        //console.log('Request Data:', data);

        fetch(url, {
            headers: {
                'apikey': API_KEY,
                'content-type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => {
                    throw new Error(`HTTP error! status: ${response.status}, message: ${text}`);
                });
            }
            return response.json();
        })
        .then(handleFlightsData)
        .catch(error => {
            console.error('Error fetching flights:', error);
            if (resultsContainer) {
                resultsContainer.innerHTML = '<p class="text-center">An error occurred while fetching flights. Please try again.</p>';
            }
        })
        .finally(hideLoading);
    }

    // Handle the flights data received from the API
    function handleFlightsData(response) {
        if (!resultsContainer) {
            console.error('Results container not found');
            return;
        }

        resultsContainer.innerHTML = '';

        if (response.data && response.data.length > 0) {
            airlineDictionary = {}; // Reset airline dictionary
            const flightsList = createFlightsList(response.data, response.currency);
            resultsContainer.appendChild(flightsList);
            updateAirlineFilter();
            lazyLoadImages();
            // Call generateCountryPage after displaying results
            generateCountryPage(response);
        } else {
            resultsContainer.innerHTML = '<p class="text-center">No flights found. Please try a different search.</p>';
        }

        //console.log('API Response:', response);
    }

    function createFlightsList(flights, currency) {
        const flightsList = document.createElement('ul');
        flightsList.className = 'flights-list mb-0';

        flights.forEach(flight => {
            const flightElement = createFlightElement(flight, currency);
            flightsList.appendChild(flightElement);
        });

        return flightsList;
    }

    // Create a single flight element
    function createFlightElement(flight, currency) {
        const li = document.createElement('li');
        li.className = 'flight mb-3';
        
        const outboundRoutes = flight.route.filter(route => route.return === 0);
        const inboundRoutes = flight.route.filter(route => route.return === 1);
        
        const outboundLogo = createAirlineLogo(outboundRoutes.map(route => route.airline));
        const outboundStops = getStopsText(outboundRoutes);
        const outboundDuration = getTotalDuration(outboundRoutes);
        
        let inboundLogo = '';
        let inboundStops = '';
        let inboundDuration = '';
        
        if (inboundRoutes.length > 0) {
            inboundLogo = createAirlineLogo(inboundRoutes.map(route => route.airline));
            inboundStops = getStopsText(inboundRoutes);
            inboundDuration = getTotalDuration(inboundRoutes);
        }
        
        const routesSection = createRoutesSection(flight.route);
        
        // Create a unique ID for the collapsible section using the booking_token
        const collapseId = `flight-${flight.booking_token.replace(/[^a-zA-Z0-9-_]/g, '')}`;
        
        li.innerHTML = `<div class="row vertical-align">
                <div class="col-xs-2 col-sm-2 col-md-2 dotted-line">
                    <small>${getCurrencySymbol(currency)}</small><span class="price">${formatPrice(flight.price)}</span>
                </div>
                <div class="col-xs-9 col-sm-9 col-md-9">
                    <div class="row vertical-align dotted-line">
                        <div class="col-xs-2 col-sm-2 col-md-2 pl-0">
                            ${outboundLogo}
                        </div>
                        <div class="col-xs-3 col-sm-3 col-md-3 px-0">
                            <span class="reduced">
                                ${moment(new Date(outboundRoutes[0].local_departure)).utc().format("h:mma")} - 
                                ${moment(new Date(outboundRoutes[outboundRoutes.length - 1].local_arrival)).utc().format("h:mma")}
                            </span>
                            <br>
                            <small class="text-muted">
                                ${moment(new Date(outboundRoutes[0].local_departure)).utc().format("ddd MMM Do YYYY")}
                            </small>
                        </div>
                        <div class="col-xs-5 col-sm-5 col-md-5">
                            ${outboundDuration}
                            <br>
                            <small class="text-muted">
                                ${outboundRoutes[0].cityFrom} (${outboundRoutes[0].flyFrom}) &rarr; 
                                ${outboundRoutes[outboundRoutes.length - 1].cityTo} (${outboundRoutes[outboundRoutes.length - 1].flyTo})
                            </small>
                        </div>
                        <div class="col-xs-2 col-sm-2 col-md-2 px-0">
                            ${outboundStops}
                        </div>
                    </div>
                    ${inboundRoutes.length > 0 ? `
                    <div class="row vertical-align dotted-line">
                        <div class="col-md-12 pt-1"></div>
                        <div class="col-xs-2 col-sm-2 col-md-2 pl-0">
                            ${inboundLogo}
                        </div>
                        <div class="col-xs-3 col-sm-3 col-md-3 px-0">
                            <span class="reduced">
                                ${moment(new Date(inboundRoutes[0].local_departure)).utc().format("h:mma")} - 
                                ${moment(new Date(inboundRoutes[inboundRoutes.length - 1].local_arrival)).utc().format("h:mma")}
                            </span>
                            <br>
                            <small class="text-muted">
                                ${moment(new Date(inboundRoutes[0].local_departure)).utc().format("ddd MMM Do YYYY")}
                            </small>
                        </div>
                        <div class="col-xs-5 col-sm-5 col-md-5">
                            ${inboundDuration}
                            <br>
                            <small class="text-muted">
                                ${inboundRoutes[0].cityFrom} (${inboundRoutes[0].flyFrom}) &rarr; 
                                ${inboundRoutes[inboundRoutes.length - 1].cityTo} (${inboundRoutes[inboundRoutes.length - 1].flyTo})
                            </small>
                        </div>
                        <div class="col-xs-2 col-sm-2 col-md-2 px-0">
                            ${inboundStops}
                        </div>
                    </div>` : ''}
                </div>
                <div class="col-xs-1 col-sm-1 col-md-1">
                    <div class="btn-group-vertical">
                        <a href="${generateGoogleFlightsUrl(flight.route)}" class="btn btn-sm btn-outline-primary mb-2" target="_blank" rel="noopener">
                            <i class="fa fa-google" aria-hidden="true"></i>
                        </a>
                    </div>
                </div>
            </div>
            <div class="collapse" id="${collapseId}">
                ${routesSection}
                <a href="${flight.deep_link}" target="_blank" rel="nofollow" class="btn btn-outline-primary btn-block mb-2 mt-3">Book Flight <i class="fa fa-arrow-right" aria-hidden="true"></i></a>
            </div>`;
        return li;
    }

    // Generate country page for search engines
    function generateCountryPage(response) {
        //console.log('Response data:', response.data);
        
        const fromCode = safeGetValue('from-data');
        const toCode = safeGetValue('to-data');
        
        //console.log('From code:', fromCode);
        //console.log('To code:', toCode);

        const formData = new FormData();
        formData.append('from_code', fromCode);
        formData.append('to_code', toCode);
        formData.append('flights', resultsContainer.innerHTML);
        formData.append('currency', safeGetValue('currency'));
        formData.append('price', response.data[0]?.price ? formatPrice(response.data[0].price) : '');
        formData.append('flight_type', safeGetValue('type'));

        //console.log('Form data:', Object.fromEntries(formData));

        fetch('/generate.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            //console.log('Response from generate.php:', data);
            if (data.status === 'error') {
                //console.log('Page not generated:', data.message);
                // You might want to handle this case in the UI, e.g., show a message to the user
            } else if (data.status === 'success') {
                //console.log('Country page generated successfully:', data.filename);
            }
        })
        .catch(error => {
            console.error('Error in fetch operation:', error);
        });
    }

    // Update airline filter
    function updateAirlineFilter() {
        const currentlySelectedAirlines = $(airlineFilterSelect).val() || [];
        const previousOptions = $(airlineFilterSelect).find('option').map(function() { return this.value; }).get();
        
        updateAirlineFilterOptions();
        
        // If it's the initial load or a completely new set of airlines, select all
        const isInitialLoad = previousOptions.length === 0 || !previousOptions.every(airline => airlineDictionary.hasOwnProperty(airline));
        
        initializeMultiSelect(isInitialLoad);
        
        if (!isInitialLoad) {
            // Restore previously selected airlines if they still exist in the new options
            const airlinesToSelect = currentlySelectedAirlines.filter(airline => airlineDictionary.hasOwnProperty(airline));
            $(airlineFilterSelect).multiselect('select', airlinesToSelect);
        }
        
        $(airlineFilterSelect).multiselect('updateButtonText');
    }

    // Update airline filter options
    function updateAirlineFilterOptions() {
        airlineFilterSelect.innerHTML = '';
        Object.entries(airlineDictionary).forEach(([key, value]) => {
            if (key !== 'undefined') {
                const option = new Option(value, key);
                option.selected = true;
                airlineFilterSelect.add(option);
            }
        });
    }

    // Initialize multiselect plugin
    function initializeMultiSelect(selectAll = false) {
        $(airlineFilterSelect).multiselect('destroy');
        $(airlineFilterSelect).multiselect({
            includeSelectAllOption: true,
            buttonClass: 'btn btn-primary-outline',
            numberDisplayed: 1,
            maxHeight: 450,
            onChange: handleMultiselectChange,
            onSelectAll: handleMultiselectChange,
            onDeselectAll: handleMultiselectChange
        });
        
        if (selectAll) {
            $(airlineFilterSelect).multiselect('selectAll', false);
        }
    }

    // Handle multiselect change
    function handleMultiselectChange() {
        const selectedAirlines = $(airlineFilterSelect).val() || [];
        const flights = Array.from(document.querySelectorAll('.flight'));
        
        flights.forEach(flight => {
            // Get all airline codes from both outbound and inbound routes
            const flightAirlines = new Set();
            
            // Check outbound route
            flight.querySelector('.row.vertical-align').querySelectorAll('.col-md-2.pl-0 img').forEach(img => {
                flightAirlines.add(img.src.split('/').pop().split('.')[0]);
            });
            
            // Check inbound route (if exists)
            const inboundRoute = flight.querySelector('.row.vertical-align.mt-2');
            if (inboundRoute) {
                inboundRoute.querySelectorAll('.col-md-2.pl-0 img').forEach(img => {
                    flightAirlines.add(img.src.split('/').pop().split('.')[0]);
                });
            }
            
            // Check if all of the flight's airlines are in the selected airlines
            const shouldShow = Array.from(flightAirlines).every(airline => selectedAirlines.includes(airline));
            flight.style.display = shouldShow ? '' : 'none';
        });

        const visibleFlights = flights.filter(flight => flight.style.display !== 'none');
        if (visibleFlights.length === 0) {
            const noFlightsMessage = document.createElement('p');
            noFlightsMessage.textContent = 'No flights found for the selected airlines. Please try a different selection.';
            noFlightsMessage.className = 'no-flights-message';
            resultsContainer.appendChild(noFlightsMessage);
        } else {
            // Remove the "no flights found" message if it exists
            const noFlightsMessage = resultsContainer.querySelector('.no-flights-message');
            if (noFlightsMessage) {
                noFlightsMessage.remove();
            }
        }
    }

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

    // Show loading indicator
    function showLoading() {
        $('.loading').show();
    }

    // Hide loading indicator
    function hideLoading() {
        $('.loading').hide();
    }
});