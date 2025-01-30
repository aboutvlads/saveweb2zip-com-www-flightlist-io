/* Load Airline Filter Button */
$('#airlinefilter').multiselect({
  buttonClass: 'btn btn-primary-outline',
});

document.addEventListener('DOMContentLoaded', function() {
  // Function to set currency based on country code
  function setCurrencyByCountry() {
    const countryCode = document.getElementById('countryip').textContent.trim();
    const currencySelect = document.getElementById('currency');
    
    // Map of country codes to currencies
    const countryCurrencyMap = {
      'US': 'USD', 'AU': 'AUD', 'AZ': 'AZN', 'BR': 'BRL', 'GB': 'GBP', 'CA': 'CAD',
      'CN': 'CNY', 'DK': 'DKK', 'IL': 'ILS', 'IN': 'INR', 'MX': 'MXN',
      'NZ': 'NZD', 'NO': 'NOK', 'PL': 'PLN', 'RU': 'RUB', 'ZA': 'ZAR',
      'SE': 'SEK', 'CH': 'CHF', 'TR': 'TRY', 'ES': 'EUR', 'DE': 'EUR',
      'FR': 'EUR', 'IT': 'EUR', 'NL': 'EUR', 'BE': 'EUR', 'AT': 'EUR',
      'IE': 'EUR', 'PT': 'EUR', 'FI': 'EUR', 'GR': 'EUR', 'LU': 'EUR'
    };

    // Get all available currency options
    const availableCurrencies = Array.from(currencySelect.options).map(option => option.value);

    let currency;

    if (countryCurrencyMap.hasOwnProperty(countryCode)) {
      // If the country code is in our map, use its corresponding currency
      currency = countryCurrencyMap[countryCode];
    } else {
      // If country is not in the map, default to USD
      currency = 'USD';
    }

    // Check if the selected currency is available in the dropdown
    if (!availableCurrencies.includes(currency)) {
      currency = 'USD'; // Default to USD if the currency is not available
    }

    // Set the selected currency
    currencySelect.value = currency;

    // Trigger the change event to update the currency symbol
    currencySelect.dispatchEvent(new Event('change'));
  }

  // Call the function on page load
  setCurrencyByCountry();

  // Your existing function for updating currency symbol, with modifications
  const currencies = {
    USD: { symbol: 'US$' },
    AUD: { symbol: 'AU$' },
    AZN: { symbol: '₼' },
    BRL: { symbol: 'R$' },
    CAD: { symbol: 'CA$' },
    CNY: { symbol: '元' },
    EUR: { symbol: '€' },
    GBP: { symbol: '£' },
    ILS: { symbol: '₪' },
    INR: { symbol: '₹' },
    MXN: { symbol: 'MX$' },
    NZD: { symbol: 'NZ$' },
    NOK: { symbol: 'kr' },
    PLN: { symbol: 'zł' },
    RUB: { symbol: '₽' },
    ZAR: { symbol: 'R' },
    SEK: { symbol: 'kr' },
    CHF: { symbol: 'CHF' },
    DKK: { symbol: 'kr' },
    TRY: { symbol: '₺' }
  };
  
  const budgetCurrency = document.getElementById('budgetCurrency');
  const budgetNumber = document.getElementById('budget');
  const currencySelect = document.getElementById('currency');
  
  function updateCurrencySymbol() {
    const selectedCurrency = currencySelect.value;
    const currency = currencies[selectedCurrency];
    
    // Update the currency symbol in both places
    budgetCurrency.textContent = currency.symbol;
    document.querySelector('output#budgetCurrency').textContent = currency.symbol;
    
    // Clear the budget value
    budgetNumber.value = '';
  }

  // Add event listener for currency changes
  currencySelect.addEventListener('change', updateCurrencySymbol);

  // Call updateCurrencySymbol once on page load to set initial values
  updateCurrencySymbol();
});

// Common configuration for all location inputs
function createLocationConfig(inputId, dataId) {
  return {
    url: "data/v2/locations.js",
    dataType: "json",
    ajaxSettings: {
      dataType: "json",
      method: "GET",
      data: {
        cache: true
      }
    },
    getValue: function(location) {
      switch(location.type) {
        case "country":
        case "city":
          return `${location.name} (${location.code})`;
        case "region":
          return location.name;
        default:
          return `${location.city.name} (${location.code})`;
      }
    },
    template: {
      type: "custom",
      method: function(value, location) {
        switch(location.type) {
          case "country":
            return `${location.name} (${location.code}) <span>All cities in ${location.name}</span>`;
          case "region":
            return `${location.name} <span>All countries in ${location.name}</span>`;
          case "city":
            return `${location.name}, ${location.country.name} (${location.code}) <span>All ${location.airports} airports in ${location.name}</span>`;
          default:
            return `${location.city.name}, ${location.city.country.name} (${location.code}) <span>${location.name}</span>`;
        }
      }
    },
    list: {
      onSelectItemEvent: function() {
        var selectedData = $(`#${inputId}`).getSelectedItemData();
        $(`#${dataId}`).val(selectedData.id).trigger("change");
      },
      match: { enabled: true },
      maxNumberOfElements: 15,
      showAnimation: {
        type: "fade",
        time: 50,
        callback: function() {}
      }
    },
  };
}

// Apply configuration to inputs
$("#from-input").easyAutocomplete(createLocationConfig("from-input", "from-data"));
$("#to-input").easyAutocomplete(createLocationConfig("to-input", "to-data"));
//$("#exclude-input").easyAutocomplete(createLocationConfig("exclude-input", "exclude-data"));

/* Mobile Share */
$(function() {
  $("#share").on('click', function() {
    if (navigator.share) {
      navigator.share({
        title: document.title,
        url: window.location.href
      })
    }
  });
});

/* Clear Inputs */
$(function() {
  function setupClearButton(clearButtonId, inputId, dataId) {
    $(`#${clearButtonId}`).on('click', function() {
      $(`#${inputId}, #${dataId}`).val("");
    });
  }

  // Set up clear functionality for departure, destination, and exclude inputs
  setupClearButton("clear-departure-input", "from-input", "from-data");
  setupClearButton("clear-destination-input", "to-input", "to-data");
  setupClearButton("clear-exclude-input", "exclude-input", "exclude-data");
});

/* Update allowed bags selection */
function updateBaggageOptions() {
    const adults = parseInt(document.getElementById('adults').value);
    const children = parseInt(document.getElementById('children').value);
    const totalPassengers = adults + children;

    const maxCabinBags = totalPassengers; // 1 per passenger
    const maxCheckedBags = totalPassengers * 2; // 2 per passenger

    const cabinBagsSelect = document.getElementById('cabinbags');
    const checkedBagsSelect = document.getElementById('checkedbags');

    // Update cabin bags options
    updateSelectOptions(cabinBagsSelect, maxCabinBags);

    // Update checked bags options
    updateSelectOptions(checkedBagsSelect, maxCheckedBags);
}

function updateSelectOptions(selectElement, maxValue) {
    const currentValue = parseInt(selectElement.value);
    
    // Clear existing options
    selectElement.innerHTML = '';

    // Add new options
    for (let i = 0; i <= maxValue; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        selectElement.appendChild(option);
    }

    // Restore previous value if it's still valid, otherwise set to max
    selectElement.value = (currentValue <= maxValue) ? currentValue : maxValue;
}

// Add event listeners to passenger selects
document.getElementById('adults').addEventListener('change', updateBaggageOptions);
document.getElementById('children').addEventListener('change', updateBaggageOptions);

// Initial call to set up correct options
updateBaggageOptions();

/* Display or hide span depending on type of flight selected */
$(function() {
  $("#type").on('change', function() {
    if ($(this).find(":selected").val() === "return") {
      if (isMobile()) {
        $(".retrange").addClass("d-flex");
        $(".retrange .input-group-addon").show();
      } else {
        $("#deprange").removeClass("rounded-right");
        $("#deprange").addClass("rounded-0");
        $(".deprange").removeClass("col-lg-6");
        $(".deprange").addClass("col-lg-3 pr-0 mr-0");
        $(".retrange").addClass("pl-0 ml-0");
        $(".retrange").show();
      }
    } else {
      if (isMobile()) {
        $(".retrange").removeClass("d-flex");
        $(".retrange .input-group-addon").hide();
      } else {
        $(".deprange").removeClass("col-lg-3 pr-0 mr-0");
        $(".deprange").addClass("col-lg-6");
        $("#deprange").removeClass("rounded-0");
        $("#deprange").addClass("rounded-right");
        $(".retrange").hide();
      }
    }
  });
});

/* Display tooltips */
$(function () {
  $('[data-toggle="tooltip"]').tooltip()
})