//
// Global state
//
// map     - the map object
// usermark- marks the user's position on the map
// markers - list of markers on the current map (not including the user position)
// 
//

//
// First time run: request current location, with callback to Start
//
if (navigator.geolocation)  {
    navigator.geolocation.getCurrentPosition(Start);
}

function componentToHex(c) {
// Source: http://stackoverflow.com/a/5624139
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}
function rgbToHex(r, g, b) {
// Source: http://stackoverflow.com/a/5624139
    return componentToHex(r) + componentToHex(g) + componentToHex(b);
}


function UpdateMapById(id, tag) {

  var target = document.getElementById(id);
  if (target != null) {
    var data = target.innerHTML;
    console.log("Data: " + data.toString());
    var rows  = data.split("\n");
    for (i in rows) {
    var cols = rows[i].split("\t");
    var lat = cols[0];
    var long = cols[1];

    if (tag=="OPINION") {
      if (cols[2]<0){ // Opinion is red
        var rgb = new Array(Math.round(cols[2]*-1*255),0,0);
      }
      else if (cols[2]>0){ // Opinion is blue
        var rgb = new Array(0,0,Math.round(cols[2]*255));
      }
      else { // Opinion is nothing
        var rgb = new Array(0,255,0);
      }
      var pinColor = rgbToHex(rgb[0],rgb[1],rgb[2]);
      // console.log("COLOR: "+hex+"/"+rgb[0].toString()+"-"+rgb[1].toString()+"-"+rgb[2].toString());
      var pinImage = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + pinColor,
        new google.maps.Size(21, 34),
        new google.maps.Point(0,0),
        new google.maps.Point(10, 34));
    } else {
      var pinImage = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + "eeeeee",
        new google.maps.Size(21, 34),
        new google.maps.Point(0,0),
        new google.maps.Point(10, 34)); 
    }

    console.log("Updating index: " + i.toString());

	  markers.push(new google.maps.Marker({ map:map,
						    position: new google.maps.LatLng(lat,long),
						    icon: pinImage, title: tag+"\n"+cols.join("\n")}));
	
    }
  }
}

function ClearMarkers()
{
    // clear the markers
    while (markers.length>0) { 
	markers.pop().setMap(null);
    }
}


function UpdateMap()
{
    var color = document.getElementById("color");
    
    color.innerHTML="<b><blink>Updating Display...</blink></b>";
    color.style.backgroundColor='white';

    ClearMarkers();

    UpdateMapById("committee_data","COMMITTEE");
    UpdateMapById("candidate_data","CANDIDATE");
    UpdateMapById("individual_data", "INDIVIDUAL");
    UpdateMapById("opinion_data","OPINION");


    color.innerHTML="Ready";
    
    if (Math.random()>0.5) { 
	color.style.backgroundColor='blue';
    } else {
	color.style.backgroundColor='red';
    }

}

function NewData(data)
{
  var target = document.getElementById("data");
  if (target != null) { 
    target.innerHTML = data;

    UpdateMap();
  }
}

function ViewShift()
{
    var bounds = map.getBounds();

    var ne = bounds.getNorthEast();
    var sw = bounds.getSouthWest();

    var color = document.getElementById("color");

    color.innerHTML="<b><blink>Querying...("+ne.lat()+","+ne.lng()+") to ("+sw.lat()+","+sw.lng()+")</blink></b>";
    color.style.backgroundColor='white';
   
    var what = findCheckboxes();
    var cycles = findCycles($("#election-cycle-checkboxes").find('input'));

    $.get("rwb.pl?act=near&latne="+ne.lat()+"&longne="+ne.lng()+"&latsw="+sw.lat()+"&longsw="+sw.lng()+"&format=raw&what="+what+"&cycle="+cycles,NewData);

    // Update the give opinion date link with the latitude and longitude of the center of the map
    var latitude = (ne.lat() + sw.lat()) / 2;
    var longitude = (ne.lng() + sw.lng()) / 2;
    $("#give-opinion-link").attr('href',"rwb.pl?act=give-opinion-data&lat="+latitude+"&long="+longitude);
}


function Reposition(pos)
{
    var lat=pos.coords.latitude;
    var long=pos.coords.longitude;

    map.setCenter(new google.maps.LatLng(lat,long));
    usermark.setPosition(new google.maps.LatLng(lat,long));
}


function Start(location) 
{
  var lat = location.coords.latitude;
  var long = location.coords.longitude;
  var acc = location.coords.accuracy;
  
  var mapc = $( "#map");

  map = new google.maps.Map(mapc[0], 
			    { zoom:16, 
				center:new google.maps.LatLng(lat,long),
				mapTypeId: google.maps.MapTypeId.ROADMAP
				} );

  usermark = new google.maps.Marker({ 
              map:map,
					    position: new google.maps.LatLng(lat,long),
					    title: 'You are here',
              icon: 'http://maps.google.com/mapfiles/marker_white.png'
            });

  markers = new Array;

  var color = document.getElementById("color");
  color.style.backgroundColor='white';
  color.innerHTML="<b><blink>Waiting for first position</blink></b>";

  google.maps.event.addListener(map,"bounds_changed",ViewShift);
  google.maps.event.addListener(map,"center_changed",ViewShift);
  google.maps.event.addListener(map,"zoom_changed",ViewShift);

  navigator.geolocation.watchPosition(Reposition);

}

function findCheckboxes() {
  var what = "";
   
  if ($("#committee").is(':checked')) {
    if (what == "") { what += "committees"; }
    else { what += ",committees"; }
  }
  if ($("#opinion").is(':checked')) {
    if (what == "") { what += "opinions"; }
    else { what += ",opinions"; }
  }
  if ($("#candidate").is(':checked')) {
    if (what == "") { what += "candidates"; }
    else { what += ",candidates"; }
  }
  if ($("#individual").is(':checked')) {
    if (what == "") { what += "individuals"; }
    else { what += ",individuals"; }
  }  
  console.log(what);
  return what;
}

function findCycles($cycles) {
  var cyclesArray = [];
  $cycles.each(function() {
    if ($(this).is(':checked')) {
      console.log($(this));
      var value = String($(this).val());
      cyclesArray.push(value);
    }
  });
  if (cyclesArray.length > 0) {
    return cyclesArray.join(",");
  } else {
    return "";
  }
}

// Get all of the checkboxes for the filters
$filters = $("#opinion, #committee, #candidate, #individual");
// Get all of the checkboxes for the cycles
$cycles = $("#election-cycle-checkboxes").find('input');

// Handle whenever a checkbox is changed
$filters.add($cycles).live('change', function() {
  ClearMarkers();
  
  var bounds = map.getBounds();
  var ne = bounds.getNorthEast();
  var sw = bounds.getSouthWest();

  var what = findCheckboxes();
  var cycles = findCycles($("#election-cycle-checkboxes").find('input'));

  $.get("rwb.pl?act=near&latne="+ne.lat()+"&longne="+ne.lng()+"&latsw="+sw.lat()+"&longsw="+sw.lng()+"&format=raw&what="+what+"&cycle="+cycles,NewData);
  console.log("rwb.pl?act=near&latne="+ne.lat()+"&longne="+ne.lng()+"&latsw="+sw.lat()+"&longsw="+sw.lng()+"&format=raw&what="+what+"&cycle="+cycles);
});
