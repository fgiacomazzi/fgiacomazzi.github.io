(function($) {

	"use strict";

const formatAPI = (month, year) => `https://calendardisponibilities.azurewebsites.net/api/httptrigger?month=${month}&year=${year}&code=ioV0woCnEqzvaidEYHvm1CVQL82aSl4jzGsL4gCuzdFS7ecm7f1SDA==`;

// Setup the calendar with the current date
$(document).ready(function(){
    var date = new Date();
    var today = date.getDate();
    // Set click handlers for DOM elements
    $(".right-button").click({date: date}, next_year);
    $(".left-button").click({date: date}, prev_year);
    $(".month").click({date: date}, month_click);
    //$("#add-button").click({date: date}, new_event);
    // Set current month as active
    $(".months-row").children().eq(date.getMonth()).addClass("active-month");
    init_calendar(date);
    var events = check_events(today, date.getMonth()+1, date.getFullYear());
    show_events(events, months[date.getMonth()], today, date.getFullYear());
    // GET FILE FROM INTERNET, THEN CALL process_events() FUNCTION
    fetch(formatAPI(date.getMonth()+1, date.getFullYear()))
        .then(response => response.json())
        .then(data => process_events(data["disp"], date));
});

function process_events(disp, date){
    // AT DOCUMENT READY YOU DOWNLOAD THE FILE AND PUT ALL THE IN-DISPONIBILITIES IN A JSON OBJECT
    // HERE YOU CREATE THE DISPONIBILITIES BY SUBTRACTING THE INDISPONIBILITIES FROM THE COMPLETE SET OF THAT MONTH
    // IN THIS WAY YOU CAN HANDLE EVERY MONTH AND YEAR WITHOUT FILLING THE MEMORY WITH ALL DISPONIBILITIES
    // FOR EXAMPLE TO HANDLE FULL HOURS (NOT HALF) YOU CAN DO
    //
    // disponibilities.empty()
    // for day in range(0, month.getLastDay()):
    //     for hour in range(9,18):
    //         if disponible(day, month, year, hour):
    //             disponibilities.append(day, month, year, hour)
    // var events = check_events(today, month, year);
    // show_events(events, months[month], today);
    disponibilities["events"] = []
    for (const evnt of disp) {
        const from = new Date(evnt["from"]);
        const to = new Date(evnt["to"]);
        disponibilities["events"].push({
                "hour": from.getHours().toString().padStart(2, '0') + ":" + from.getMinutes().toString().padStart(2, '0')
                + " - " + to.getHours().toString().padStart(2, '0') + ":" + to.getMinutes().toString().padStart(2, '0'),
            "year": from.getFullYear(),
            "month": from.getMonth() + 1,
            "day": from.getDate()
        });
    }
    init_calendar(date);
}

function getUserData() {
    let datetimestr = $(this).attr('id').slice(0, -1).replaceAll("x", " ").replaceAll("y", ":").replaceAll("z", "-");
    let datesplit = datetimestr.split(" ")
    Swal.fire({
        title: 'Le tue informazioni',
        html: ` <div>Hai selezionato: ${datetimestr}</div>
                <input type="text" id="name" class="swal2-input" placeholder="Nome e Cognome">
                <input type="tel" id="phone" class="swal2-input" placeholder="Cellulare">
                <input type="text" id="home" class="swal2-input" placeholder="Indirizzo di residenza">
                <input type="text" id="cf" class="swal2-input" placeholder="Codice Fiscale">`,
        confirmButtonText: 'Prenota',
        focusConfirm: false,
        showCloseButton: true,
        showCancelButton: true,
        preConfirm: () => {
            const name = Swal.getPopup().querySelector('#name').value
            const phone = Swal.getPopup().querySelector('#phone').value
            const home = Swal.getPopup().querySelector('#home').value
            const cf = Swal.getPopup().querySelector('#cf').value
            if (!name || !phone || !cf || !home) {
                Swal.showValidationMessage(`Inserisci le tue informazioni`)
            }
            return { name: name, phone: phone, cf: cf, home: home }
        }
    }).then((result) => {
        bookVisit(datesplit[0], (months.indexOf(datesplit[1])+1).toString(), datesplit[2], datesplit[3].split(":")[0], datesplit[3].split(":")[1], datesplit[5].split(":")[0], datesplit[5].split(":")[1], result.value.name, result.value.phone, result.value.cf, result.value.home);
    })
}

function bookVisit(d, m, y, h, t, hend, tend, name, phone, cf, home){
    document.body.classList.add("blurdisable");
    const l = (parseInt(tend) - parseInt(t) + 60*(parseInt(hend) - parseInt(h))).toString();  // duration
    window.location = `https://strcheckout.azurewebsites.net/api/httptrigger?code=kImrEXF0kjIEUFhqV1u53UIPuC0B2SbSM9/nYKlwuMqmxuEoT4EJOQ==&d=${d}&m=${m}&y=${y}&h=${h}&t=${t}&l=${l}&name=${name}&phone=${phone}&cf=${cf}&home=${home}`
}

// Initialize the calendar by appending the HTML dates
function init_calendar(date) {
    $(".tbody").empty();
    $(".events-container").empty();
    // HERE CALL process_events();
    var calendar_days = $(".tbody");
    var month = date.getMonth();
    var year = date.getFullYear();
    var day_count = days_in_month(month, year);
    var row = $("<tr class='table-row'></tr>");
    var today = date.getDate();
    // Set date to 1 to find the first day of the month
    date.setDate(1);
    var first_day = date.getDay()+6;
    // 35+firstDay is the number of date elements to be added to the dates table
    // 35 is from (7 days in a week) * (up to 5 rows of dates in a month)
    for(var i=0; i<35+first_day; i++) {
        // Since some of the elements will be blank, 
        // need to calculate actual date from index
        var day = i-first_day+1;
        // If it is a sunday, make a new row
        if(i%7===0) {
            calendar_days.append(row);
            row = $("<tr class='table-row'></tr>");
        }
        // if current index isn't a day in this month, make it blank
        if(i < first_day || day > day_count) {
            var curr_date = $("<td class='table-date nil'>"+"</td>");
            row.append(curr_date);
        }   
        else {
            var curr_date = $("<td class='table-date'>"+day+"</td>");
            var events = check_events(day, month+1, year);
            if(today===day && $(".active-date").length===0) {
                curr_date.addClass("active-date");
                show_events(events, months[month], day, year);
            }
            // If this date has any events, style it with .event-date
            if(events.length!==0) {
                curr_date.addClass("event-date");
            }
            // Set onClick handler for clicking a date
            curr_date.click({events: events, month: months[month], day:day}, date_click);
            row.append(curr_date);
        }
    }
    // Append the last row and set the current year
    calendar_days.append(row);
    $(".year").text(year);
}

// Get the number of days in a given month/year
function days_in_month(month, year) {
    var monthStart = new Date(year, month, 1);
    var monthEnd = new Date(year, month + 1, 1);
    return (monthEnd - monthStart) / (1000 * 60 * 60 * 24);    
}

// Event handler for when a date is clicked
function date_click(event) {
    $(".events-container").show(250);
    $("#dialog").hide(250);
    $(".active-date").removeClass("active-date");
    $(this).addClass("active-date");
    show_events(event.data.events, event.data.month, event.data.day, event.data.events.length > 0 ? event.data.events[0].year : -1);
}

// Event handler for when a month is clicked
function month_click(event) {
    $(".events-container").show(250);
    $("#dialog").hide(250);
    var date = event.data.date;
    $(".active-month").removeClass("active-month");
    $(this).addClass("active-month");
    var new_month = $(".month").index(this);
    date.setMonth(new_month);
    fetch(formatAPI(date.getMonth()+1, date.getFullYear()))
        .then(response => response.json())
        .then(data => process_events(data["disp"], date));
}

// Event handler for when the year right-button is clicked
function next_year(event) {
    $("#dialog").hide(250);
    var date = event.data.date;
    var new_year = date.getFullYear()+1;
    $("year").html(new_year);
    date.setFullYear(new_year);
    fetch(formatAPI(date.getMonth()+1, date.getFullYear()))
        .then(response => response.json())
        .then(data => process_events(data["disp"], date));
}

// Event handler for when the year left-button is clicked
function prev_year(event) {
    $("#dialog").hide(250);
    var date = event.data.date;
    var new_year = date.getFullYear()-1;
    $("year").html(new_year);
    date.setFullYear(new_year);
    fetch(formatAPI(date.getMonth()+1, date.getFullYear()))
        .then(response => response.json())
        .then(data => process_events(data["disp"], date));
}

// Event handler for clicking the new event button
/*
function new_event(event) {
    // if a date isn't selected then do nothing
    if($(".active-date").length===0)
        return;
    // remove red error input on click
    $("input").click(function(){
        $(this).removeClass("error-input");
    })
    // empty inputs and hide events
    $("#dialog input[type=text]").val('');
    $("#dialog input[type=number]").val('');
    $(".events-container").hide(250);
    $("#dialog").show(250);
    // Event handler for cancel button
    $("#cancel-button").click(function() {
        $("#name").removeClass("error-input");
        $("#count").removeClass("error-input");
        $("#dialog").hide(250);
        $(".events-container").show(250);
    });
    // Event handler for ok button
    $("#ok-button").unbind().click({date: event.data.date}, function() {
        var date = event.data.date;
        var name = $("#name").val().trim();
        var count = parseInt($("#count").val().trim());
        var day = parseInt($(".active-date").html());
        // Basic form validation
        if(name.length === 0) {
            $("#name").addClass("error-input");
        }
        else if(isNaN(count)) {
            $("#count").addClass("error-input");
        }
        else {
            $("#dialog").hide(250);
            console.log("new event");
            new_event_json(name, count, date, day);
            date.setDate(day);
            init_calendar(date);
        }
    });
}
*/

// Adds a json event to disponibilities
function new_event_json(hour, count, date, day) {
    var event = {
        "hour": hour,
        "year": date.getFullYear(),
        "month": date.getMonth()+1,
        "day": day
    };
    disponibilities["events"].push(event);
}

// Display all events of the selected date in card views
function show_events(events, month, day, year) {
    // Clear the dates container
    $(".events-container").empty();
    $(".events-container").show(250);
    //console.log(disponibilities["events"]);
    // If there are no events for this date, notify the user
    if(events.length===0) {
        var event_card = $("<div class='event-card'></div>");
        var event_name = $("<div class='event-name'>Nessuna disponibilità il "+day+" "+month+".</div>");
        $(event_card).css({ "border-left": "10px solid #FF1744" });
        $(event_card).append(event_name);
        $(".events-container").append(event_card);
    }
    else {
        // Go through and add each event as a card to the events container
        for(var i=0; i<events.length; i++) {
            var datetimeid = day+"x"+month+"x"+year+"x"+events[i]["hour"].replaceAll(" ", "x").replaceAll(":", "y").replaceAll("-", "z");
            var datetimestr = day+" "+month+" " +year+": ore "+events[i]["hour"];
            var event_card = $("<div class='event-card event-real' id=" + datetimeid + "1" + "></div>");
            var event_name = $("<div class='event-name event-real' style='text-decoration: underline;' id=" + datetimeid + "2" + ">"+ datetimestr +"</div>");
            //var event_count = $("<div class='event-count'>"+events[i]["invited_count"]+" Invited</div>");
            if(events[i]["cancelled"]===true) {
                $(event_card).css({
                    "border-left": "10px solid #FF1744"
                });
                //event_count = $("<div class='event-cancelled'>Cancelled</div>");
            }
            $(event_card).append(event_name)//.append(event_count);
            $(".events-container").append(event_card);
        }
        $(".event-real").click(getUserData);
    }
}

// Checks if a specific date has any events
function check_events(day, month, year) {
    var events = [];
    for(var i=0; i<disponibilities["events"].length; i++) {
        var event = disponibilities["events"][i];
        if(event["day"]===day &&
            event["month"]===month &&
            event["year"]===year) {
                events.push(event);
            }
    }
    return events;
}

// Given data for events in JSON format
let disponibilities = {
    "events": [
    /*
    {
        "hour": "12:00",
        //"invited_count": 120,
        "year": 2021,
        "month": 9,
        "day": 25,
        "cancelled": false
    },
    {
        "hour": "13:00",
        //"invited_count": 120,
        "year": 2021,
        "month": 9,
        "day": 25,
        "cancelled": false
    }
    */
    ]
};

const months = [ 
    "Gennaio",
    "Febbraio",
    "Marzo",
    "Aprile",
    "Maggio",
    "Giugno",
    "Luglio",
    "Agosto",
    "Settembre",
    "Ottobre",
    "Novembre",
    "Dicembre"
];

})(jQuery);
