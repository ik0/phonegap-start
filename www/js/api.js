// Wait for Cordova to load
    //
    document.addEventListener("deviceready", onDeviceReady, false);
    
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    }
};

    var directionsDisplay;
    var directionsService
	var map;
	var fuel_type = 'gasoline';
	var fuel_name = 'Бензин А95';
	var avg_price = '0,00';
	var diff_formatted = '+0,00';
	
	var mylat;
	var mylon;
	var destlat;
	var destlon;

    // Cordova is ready
    //
    function onDeviceReady() {

    	directionsService = new google.maps.DirectionsService();

        //navigator.geolocation.getCurrentPosition(onSuccess, onError, { maximumAge: 30000, timeout: 15000, enableHighAccuracy: true });
        
        // Fuelselect 
        $("#fuelselect").val(fuel_type);

		$('#fuelselect').on('change', function() {
		  	fuel_type = this.value;
		   	fuel_name = $("#fuelselect option:selected").text();;
			window.localStorage.setItem("fuel_type", fuel_type);
			window.localStorage.setItem("fuel_name", fuel_name);
			get_avg_price();
			get_diff_price();
			$('#fuel').empty().append(fuel_name);
			$.mobile.changePage('#saved', 'pop');
			//$('#result').empty().append('<i class="icon-ok"></i>Saved');
		});
		
		// Events
		$('#index').on('pageshow',function(event, ui){
			refresh_info();
		});
		
		$('#prices').on('pageshow',function(event, ui){
			refresh_prices();
		});
		
		$('#gasstations').on('pageshow',function(event, ui){
			refresh_gasstations();
		});
        
        // Refresh data
        refresh_info()
        
    }

    // onSuccess Geolocation
    //
    function onSuccess(position) {
    	mylat = position.coords.latitude;
    	mylon = position.coords.longitude;
		nearest_gasstation(position.coords.latitude,position.coords.longitude);
    }

    // onError Callback receives a PositionError object
    //
    function onError(error) {
        alert('Не може да открием Вашето местоположение\n' + 'Моля проверете настройките на телефона Ви\n' + error.message + '\n');
    }

    function refresh_info()
    {
    	$('#refresh').empty().append('<a href="#"><i  class="icon-refresh icon-spin icon-large"></i></a>');

    	fuel_type = window.localStorage.getItem("fuel_type");
    	fuel_name = window.localStorage.getItem("fuel_name");
    	
    	if (fuel_type == null) {
			fuel_type = 'gasoline';
			fuel_name = 'Бензин А95';
			window.localStorage.setItem("fuel_type", "gasoline");
			window.localStorage.setItem("fuel_name", "Бензин А95");
		}

    	avg_price = window.localStorage.getItem("avg_price");
    	$('#avg_price').empty().append(avg_price);
    	
    	$('#fuel').empty().append(fuel_name);
    	diff_formatted = window.localStorage.getItem("diff_formatted");
    	$('#diff').empty().append(diff_formatted);
    	
    	$('#avg_price').empty().append(avg_price);
    	$('#fuel').empty().append(fuel_name);
    	$('#diff').empty().append(diff_formatted);
 
    	get_avg_price();
    	get_diff_price();
    	navigator.geolocation.getCurrentPosition(onSuccess, onError, { maximumAge: 30000, timeout: 15000, enableHighAccuracy: true });
    }
    
    function refresh_gasstations()
    {
    	$('#refreshgasstations').empty().append('<a href="#"><i  class="icon-refresh icon-spin icon-large"></i></a>');
    	get_gasstattions();
    	$('#gasstations_list').listview();
    	
    }

    function refresh_prices()
    {
    	$('#refresh_prices').empty().append('<a href="#"><i  class="icon-refresh icon-spin icon-large"></i></a>');
    	get_avg_price_gasoline();
    	get_avg_price_diesel();
    	get_avg_price_lpg();
    	get_avg_price_methane();
    	
    	get_prices_gasoline();
    	get_prices_diesel();
    	get_prices_lpg();
    	get_prices_methane();
    }
    
	function nearest_gasstation(latitude,longitude)
	{
		// Get near gasstations by ajax
		$.ajax({
			url: 'http://fuelo.net/api/get_recommended_gasstation',
			type:'POST',
			dataType: 'text',
			data: { lat:latitude,lon:longitude,fuel:fuel_type },
			success: function(data){
				var obj = jQuery.parseJSON(data);
					$('#nearest_gasstation').empty().append(obj.text);
					destlat = obj.lat;
					destlon = obj.lon;
					initialize(obj.lat,obj.lon,obj.brand);
				} // End of success function of ajax form
			}); // End of ajax call 

	}

function initialize(latitude,longitude,brand)
{
	directionsDisplay = new google.maps.DirectionsRenderer();
	var mapProp = {
	  center:new google.maps.LatLng(latitude,longitude),
	  zoom:15,
	  mapTypeId:google.maps.MapTypeId.ROADMAP
	  };
	map=new google.maps.Map(document.getElementById("googleMap"),mapProp);
	directionsDisplay.setMap(map);
	directionsDisplay.setPanel(document.getElementById("directionsPanel"));

	var marker=new google.maps.Marker({
	  position:new google.maps.LatLng(latitude,longitude),
	  icon:'http://fuelo.net/img/logos/'+brand+'-small.png',
	  map: map,
	  title: "Gasstation"
	  });
	  
  	var visitor=new google.maps.Marker({
	  position:new google.maps.LatLng(mylat,mylon),
	  map: map,
	  title: "Вие се намирате тук"
	  });
	  
	  $('#refresh').empty().append('<a href="#"><i  class="icon-refresh icon-large"></i></a>');
}

function calcRoute() {
  var start = new google.maps.LatLng(mylat,mylon);
  var end = new google.maps.LatLng(destlat,destlon);
  var request = {
    origin:start,
    destination:end,
    travelMode: google.maps.TravelMode.DRIVING
  };
  directionsService.route(request, function(result, status) {
    if (status == google.maps.DirectionsStatus.OK) {
    	$('#directionsPanel').empty()
      	directionsDisplay.setDirections(result);
    } else { alert (status); } 
  });
}

	function get_avg_price()
	{
		// Get near gasstations by ajax
		$.ajax({
			url: 'http://fuelo.net/api/get_avg_price',
			type:'POST',
			dataType: 'text',
			data: { fuel:fuel_type },
			success: function(data){
				var obj = jQuery.parseJSON(data);
					$('#avg_price').empty().append(obj.avg_price);
					window.localStorage.setItem("avg_price", obj.avg_price);
				} // End of success function of ajax form
			}); // End of ajax call 
	}
	
	function get_diff_price()
	{
		// Get near gasstations by ajax
		$.ajax({
			url: 'http://fuelo.net/api/get_diff_price',
			type:'POST',
			dataType: 'text',
			data: { fuel:fuel_type },
			success: function(data){
				var obj = jQuery.parseJSON(data);
					$('#diff').empty().append(obj.diff_formatted);
					window.localStorage.setItem("diff_formatted", obj.diff_formatted);
					window.localStorage.setItem("diff", obj.diff);
				} // End of success function of ajax form
			}); // End of ajax call 
	}

	function get_avg_price_gasoline()
	{
		// Get near gasstations by ajax
		$.ajax({
			url: 'http://fuelo.net/api/get_avg_price',
			type:'POST',
			dataType: 'text',
			data: { fuel:'gasoline' },
			success: function(data){
				var obj = jQuery.parseJSON(data);
					$('#gasolineprice').empty().append(obj.avg_price);
					window.localStorage.setItem("avg_price_gasoline", obj.avg_price);
				} // End of success function of ajax form
			}); // End of ajax call 
	}
	
	function get_avg_price_diesel()
	{
		// Get near gasstations by ajax
		$.ajax({
			url: 'http://fuelo.net/api/get_avg_price',
			type:'POST',
			dataType: 'text',
			data: { fuel:'diesel' },
			success: function(data){
				var obj = jQuery.parseJSON(data);
					$('#dieselprice').empty().append(obj.avg_price);
					window.localStorage.setItem("avg_price_diesel", obj.avg_price);
				} // End of success function of ajax form
			}); // End of ajax call 
	}

	function get_avg_price_lpg()
	{
		// Get near gasstations by ajax
		$.ajax({
			url: 'http://fuelo.net/api/get_avg_price',
			type:'POST',
			dataType: 'text',
			data: { fuel:'lpg' },
			success: function(data){
				var obj = jQuery.parseJSON(data);
					$('#lpgprice').empty().append(obj.avg_price);
					window.localStorage.setItem("avg_price_lpg", obj.avg_price);
				} // End of success function of ajax form
			}); // End of ajax call 
	}

	function get_avg_price_methane()
	{
		// Get near gasstations by ajax
		$.ajax({
			url: 'http://fuelo.net/api/get_avg_price',
			type:'POST',
			dataType: 'text',
			data: { fuel:'methane' },
			success: function(data){
				var obj = jQuery.parseJSON(data);
					$('#methaneprice').empty().append(obj.avg_price);
					window.localStorage.setItem("avg_price_methane", obj.avg_price);
				} // End of success function of ajax form
			}); // End of ajax call 
	}

	function get_gasstattions()
	{
		// Get near gasstations by ajax
		$.ajax({
			url: 'http://fuelo.net/api/get_recommended_gasstations',
			type:'POST',
			dataType: 'text',
			data: { lat:mylat,lon:mylon,fuel:fuel_type },
			success: function(data){
				var obj = jQuery.parseJSON(data);
					$('#gasstations_list').empty().append(obj.list);
					$('#gasstations_list').listview('refresh');
					$('#refreshgasstations').empty().append('<a href="#"><i  class="icon-refresh icon-large"></i></a>');
				} // End of success function of ajax form
			}); // End of ajax call 
	}
	
	function get_prices_gasoline()
	{
		// Get near gasstations by ajax
		$.ajax({
			url: 'http://fuelo.net/api/get_prices',
			type:'POST',
			dataType: 'text',
			data: { fuel_type:'gasoline' },
			success: function(data){
				var obj = jQuery.parseJSON(data);
					$('#gasoline_prices').empty().append(obj.list);
					if (fuel_type == 'gasoline')
					{
						$('#gasoline').trigger('expand');
					}
					//$('#prices_list').collapsible-set('refresh');
				} // End of success function of ajax form
			}); // End of ajax call 
	}

	function get_prices_diesel()
	{
		// Get near gasstations by ajax
		$.ajax({
			url: 'http://fuelo.net/api/get_prices',
			type:'POST',
			dataType: 'text',
			data: { fuel_type:'diesel' },
			success: function(data){
				var obj = jQuery.parseJSON(data);
					$('#diesel_prices').empty().append(obj.list);
					if (fuel_type == 'diesel')
					{
						$('#diesel').trigger('expand');
					}
					//$('#prices_list').collapsible-set('refresh');
				} // End of success function of ajax form
			}); // End of ajax call 
	}

	function get_prices_lpg()
	{
		// Get near gasstations by ajax
		$.ajax({
			url: 'http://fuelo.net/api/get_prices',
			type:'POST',
			dataType: 'text',
			data: { fuel_type:'lpg' },
			success: function(data){
				var obj = jQuery.parseJSON(data);
					$('#lpg_prices').empty().append(obj.list);
					if (fuel_type == 'lpg')
					{
						$('#lpg').trigger('expand');
					}
					//$('#prices_list').collapsible-set('refresh');
				} // End of success function of ajax form
			}); // End of ajax call 
	}

	function get_prices_methane()
	{
		// Get near gasstations by ajax
		$.ajax({
			url: 'http://fuelo.net/api/get_prices',
			type:'POST',
			dataType: 'text',
			data: { fuel_type:'methane' },
			success: function(data){
				var obj = jQuery.parseJSON(data);
					$('#methane_prices').empty().append(obj.list);
					if (fuel_type == 'methane')
					{
						$('#methane').trigger('expand');
					}
					//$('#prices_list').collapsible-set('refresh');
					$('#refresh_prices').empty().append('<a href="#"><i  class="icon-refresh icon-large"></i></a>');
				} // End of success function of ajax form
			}); // End of ajax call 
	}