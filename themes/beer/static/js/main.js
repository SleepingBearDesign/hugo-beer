    var $win = $(window);
    var winWidth = $win.width();
    var $body = $('body');
    var $beerWrapper = $('#beer-wrapper');
    var $beerWrapperInterior = $('.beer-wrapper-interior');
    var $beer = $('.single-beer-wrap');
    var _beerToggle = $('.toggle-view');
    var _gridViewOpen = false;
    var animating = 0;
    var lastPosition;
    var hoverSide;

    // change to vary speed
    var beersPerSecond = -1000; // in ms
    var winHeight;
    var halfWinHeight;
    var currentElement = $('.section').first();
    var beerSliderThreshold = 750;

    var todaysDate = moment().format('MMMM Do');
    var currentTime = moment().format('h:mm a');
    var yesterdaysDate = moment().subtract(1, 'days').format('MMMM Do');
    var tomorrowsDate = moment().add(1, 'days').format('MMMM Do');

    // ON LOAD
    $win.ready(function() {
        // age gate
        checkSomeAge();
        // check for the untappd IDs
        checkSomeBeerIDs();
        checkBreweryID();
        checkVenueID();

        // initialize everything
        init();

        // grab latest fb event
        fbevents();

        // when we scroll call the onscroll function    
        $(document).on("scroll", onScroll);
    });
    // END ON LOAD

    // RESIZE
    $win.resize(
        function() {
            if (!_gridViewOpen) {
                reset();
            }
        }
    );
    // END RESIZE

    // AGE GATE WIP
    function checkSomeAge() {

        if (!('localStorage' in window)) {
            window.localStorage = {
                _data: {},
                setItem: function(id, val) {
                    return this._data[id] = String(val);
                },
                getItem: function(id) {
                    return this._data.hasOwnProperty(id) ? this._data[id] : undefined;
                },
                removeItem: function(id) {
                    return delete this._data[id];
                },
                clear: function() {
                    return this._data = {};
                }
            }
        }

        var getLocalPath = window.location.pathname;

        localStorage.setItem("prevPath", getLocalPath);

        var ageLS = localStorage.getItem('ageVerify');
        if (ageLS != "true") { 
            $( '#age-gate-overlay-wrap' ).css('display', 'block');
        }

        $( document ).on( 'click', '#age-gate-overlay-wrap .accept', function( e ) {
        
        e.preventDefault();
        
        $( '#age-gate-overlay-wrap' ).fadeOut( 400 );
        
        localStorage.setItem('ageVerify', "true");
    } );
    }
    // END AGE GATE


    // HOVER BEGIN
    // Hover Left
    function animateLeft() {

        animating = 1;

        idealSpeed = ($beerWrapperInteriorOffset / beerWidth) * beersPerSecond;   

        TweenMax.to($beerWrapperInterior, idealSpeed / 1000, {
            left: "0px",
            ease: 'easeOutQuad'
        });

        $beer.removeClass('hoverable');
    }

    // Hover Right
    function animateRight() {

        animating = 1;

        idealSpeed = ((beerWrapperInteriorWidth - beerWrapperWidth + $beerWrapperInteriorOffset) / beerWidth) * -beersPerSecond;

        TweenMax.to($beerWrapperInterior, idealSpeed / 1000, {
            left: -(beerWrapperInteriorWidth - beerWrapperWidth - 85),
            ease: 'easeOutQuad'
        });

        $beer.removeClass('hoverable');

    }

    // Stop Animations
    function stopAnimation() {

        animating = 0;

        TweenMax.killAll();
        $beer.addClass('hoverable');

    }

    // Initialize
    function init() {

        var isGrid = localStorage.getItem("isGriddy");
        if (isGrid == "true") {
            _gridViewOpen = true;
            $('#beer-wrapper').toggleClass('gridy');
        }

        // make sure the interior beer wrapper is at it's 
        // starting point on load
        $beerWrapperInterior.css({
            left: 0
        });

        // size all elements accordingly
        if (!_gridViewOpen) {
            reset();
        }

        // toggle grid touch event
        _beerToggle.on('click', function(e) {
            $('#beer-wrapper').toggleClass('gridy');
            if (_gridViewOpen) {
                _gridViewOpen = false;
                localStorage.setItem("isGriddy", "false");
                reset();
            } else if (!_gridViewOpen) {
                _gridViewOpen = true;
                localStorage.setItem("isGriddy", "true");
                disableHoverableBeerSection();
            }
        })

        // click to scroll function
        $('a[href^="#"]').on('click', function(e) {

            e.preventDefault();
            $(document).off("scroll");

            $('a').each(function() {
                $(this).removeClass('active');
            })

            $(this).addClass('active');

            var target = this.hash;
            $target = $(target);

            $('html, body').stop().animate({

                'scrollTop': $target.offset().top + 2

            }, 500, 'swing', function() {

                window.location.hash = target;
                $(document).on("scroll", onScroll);

            });

        });


    }

    var eventsArray = [];
    function fbevents() {
        var pageAccessToken = 'CAAHnTHhhurwBAPJQbAuOSm9zCvPePt2h37LZBv8mkgUPZB6vZAQPGICGW4U6Ebis80YLyDQUXS4e3BZCYMhgZCLYPZAROphK0NtjzCN6M67tIWmlfyjHMc01wZA0GweVZCDBzL5LIl19FIgfUd781rpGfJuhVj7LZCvvvpnrJXEXnyZBTGQO1TGheqcnDwEmV5dy9YlHGVtdFMmQZDZD';
        if (typeof $('#distribution').data("pageid") !== "undefined") {
            pid = $('#distribution').data("pageid");
            $.getScript('//connect.facebook.net/en_US/sdk.js', function(){
                FB.init({
                  appId: '535790599912124',
                  version: 'v2.5'
                });     
                /* make the API call */
                FB.api(
                    "/"+ pid +"/events",{
                      access_token : pageAccessToken
                    },
                    function (response) {
                      if (response && !response.error) {
                        /* handle the result */
                        var eventsData = response.data;

                        // go through each of the sets of data
                        $.each(eventsData, function(i) {

                            //create an array to store the info we need         
                            eventArray = {
                                description: eventsData[i].description,
                                id: eventsData[i].id,
                                name: eventsData[i].name,
                                startTime: eventsData[i].start_time,
                                endTime: eventsData[i].end_time,
                                location: eventsData[i].place.name,
                                city: eventsData[i].place.location.city,
                                state: eventsData[i].place.location.state
                            };
                            // push this array to the global array to access later
                            eventsArray.push(eventArray);
                        });
                      }
                      else {
                        console.log("Facebook Response Error: " + JSON.stringify(response));
                      }
                      outputfbHTML();
                    }
                );
            });
        }
    }

    // create a function to display HTML from the FB Events feed
    var outputfbHTML = function() {

        // go through each of the arrays in the eventsArray object
        // var i=0;
        for (i = 0; i < eventsArray.length; i++) {
            date = moment(eventsArray[i].startTime).format('MMMM Do');

            if(date < todaysDate){
                i--;
                // store the info we need with the associated HTML
                date = moment(eventsArray[i].startTime).format('MMMM Do');
                name = '<h2>' + eventsArray[i].name + '</h2>';
                time = '<li>' + moment(eventsArray[i].startTime).format('h:mm a') + ' - ' + moment(eventsArray[i].endTime).format('h:mm a') + '</li>';
                place = '<li>' + eventsArray[i].city + ', ' + eventsArray[i].state + '</li>';
                description = '<p>' + eventsArray[i].description + '</p>';
                link = '<a class="selfclear" href="http://www.facebook.com/events/' + eventsArray[i].id + '/" target="_blank">Join the Event</a>';

                // if the date of the post matches todays date
                if (date === todaysDate) {
                    date = '<li> Today </li>';
                }

                // if the date of the post matches tomorrows date
                else if (date === tomorrowsDate) {
                    date = '<li> Tomorrow </li>';
                }

                // if the date of the post matches yesterdays date
                else if (date === yesterdaysDate) {
                    date = '<li> Yesterday </li>';
                }

                // if the date of the post doens't match yesterday or todays
                else {
                    date = '<li>' + date + '</li>';
                }

                // append the upcoming event html to the UL
                
                $('#events').append('<div class="size1of1"><div class="single-event-wrap">' + name + '<ul> ' + date + time + place + '</ul>' + description + link + '</div></div>');
                break;
            }
        }
    }
    // END FBEVENTS


    // RESET FUNCTION
    function reset() {

        console.log('reset()');

        winWidth = $win.width();
        winHeight = $win.height();
        halfWinHeight = winHeight / 2;
        quarterWinHeight = halfWinHeight / 2;

        // if the beerwrapper exists and the window is greater than 750
        if ($beerWrapper.length && winWidth > beerSliderThreshold) {


            beerWrapperWidth = $beerWrapper.width();
            beerWrapperOffset = $beerWrapper.offset().left;

            beerWidth = $beer.width();

            // set the width of the interior to the width of all the beer items

            if (!Modernizr.touch) {
                $beerWrapperInterior.css({
                    width: beerWidth * $beer.length + 85
                });
            } else {
                $beerWrapperInterior.css({
                    width: beerWidth * $beer.length
                });
            }

            beerWrapperInteriorWidth = $beerWrapperInterior.width();
            $beerWrapperInteriorOffset = $beerWrapperInterior.offset().left - beerWrapperOffset;

        } else if ($beerWrapper.length && winWidth < beerSliderThreshold) {
            console.log('small screen');

            $('#beer-wrapper').addClass('static-finder');
        }

        // No Tough
        if (!Modernizr.touch) {
            console.log('not touch and windows greater than 750');
            initializeHoverableBeerSection();
        }
        // Touch Screens > 750px
        else if (Modernizr.touch && winWidth > beerSliderThreshold) {
            console.log('touch and windows greater than 750');
            initializeDraggableBeerSection();
        }
    }

    // Desktop Scrolls
    function onScroll(event) {

        // this is how far you've scrolled from the top
        scrollPosition = $(document).scrollTop();

        // for each of the slide nav elements
        $('nav ul.active-page li a').each(function() {

            var currentLink = $(this); // returns <a href="#test"></a>
            var currentLinkHREF = currentLink.attr('href'); // returns #test
            var refElement = $(currentLinkHREF); // returns $('#test')
            var quarterWinHeight = $win.height() / 4;

            // check to see if the top of $('#test') is at browser top
            // if it is update the slide nav
            if (refElement.position().top - quarterWinHeight <= scrollPosition && refElement.position().top + quarterWinHeight > scrollPosition) {

                // check to see when the refelement changes
                if (currentElement[0] != refElement[0]) {

                    // remove current active class
                    $('nav ul li a').removeClass("active");

                    // add new active class
                    currentLink.addClass("active");

                    $('h1').removeClass("youarehere");
                    $('*[data-section-id="' + currentLinkHREF + '"]').addClass('youarehere');

                    // set the currentElement to the new refelement
                    currentElement = refElement;

                    console.log("refelemnt has changed update classes");

                }
            }

        });

    } // end onScroll


    // INSTAGRAM FEED
    if ($('#instafeed').length) {
        var feed = new Instafeed({
            get: 'user',
            userId: 809574210,
            accessToken: '5751603.1677ed0.ac25029e824d4109bf8e38479a2b820d',
            resolution: 'standard_resolution',
            sortby: 'least-recent',
            limit: 4
        });
        feed.run();
    }
    // END INSTAGRAM

    // TWITTER FEED
    if (typeof $('#twitterfeed').data("widgetid") !== "undefined") {
        wid = $('#twitterfeed').data("widgetid");
        var twitter = {
          "id": wid,
          "domId": 'twitterfeed',
          "maxTweets": 1,
          "enableLinks": true,
          "showUser": false,
          "showTime": false,
          "showRetweet": false,
          "showInteraction": false
        };
        twitterFetcher.fetch(twitter);
    }
    // END TWITTER

    // HOVERABLE
    function disableHoverableBeerSection() {
        stopAnimation();
        $beerWrapper.unbind("mouseenter");
        $beerWrapper.unbind("mouseleave");
        $beerWrapper.unbind("mousemove");
        $('.hoverable').unbind('mouseover');
        $beerWrapperInterior.css({

            width: 'auto',
            left: 0

        });
    }

    function initializeHoverableBeerSection() {
        if (!_gridViewOpen) {
            // hover over beer section
            $beerWrapper.mouseenter(function() {

                // track the mouse position
                $(this).mousemove(function(e) {

                    if (winWidth > beerSliderThreshold) {

                        $beerWrapperInteriorOffset = Math.round($beerWrapperInterior.offset().left - beerWrapperOffset);

                        // store the most position
                        mousemoveX = e.clientX - beerWrapperOffset;

                        // TRACK HOVER POSITION
                        // if we hover over the left side
                        if (mousemoveX < beerWrapperWidth * .333) {
                            hoverSide = 'left';
                        }

                        // if we hover over the right side
                        else if (mousemoveX > beerWrapperWidth * .666) {
                            hoverSide = 'right';
                        }

                        // if we're in the middle
                        else {
                            hoverSide = 'middle';
                        }

                        // WHAT HAPPENS WHEN WE HOVER OVER A CERTAIN SECTION

                        if (hoverSide === 'left') {

                            // if the last position is greater than the curreposition
                            // and the page is not currently animating
                            // and the interior offset is not 0 or greater
                            if (lastPosition - mousemoveX > 0 && animating === 0 && !($beerWrapperInteriorOffset >= 0)) {
                                animateLeft();
                            }

                            // else if the last position is small ther then current position
                            // the page is animating
                            // and the interior offset is not greater than or equal to zero
                            else if (lastPosition - mousemoveX < 0 && animating === 1 && !($beerWrapperInteriorOffset >= 0)) {
                                stopAnimation();
                            }

                        } else if (hoverSide === 'right') {

                            if (lastPosition - mousemoveX < 0 && animating === 0 && !($beerWrapperInteriorOffset <= -(beerWrapperInteriorWidth - beerWrapperWidth))) {

                                animateRight();

                            } else if (lastPosition - mousemoveX > 0 && animating === 1 && !($beerWrapperInteriorOffset <= -(beerWrapperInteriorWidth - beerWrapperWidth))) {

                                stopAnimation();
                            }
                        }

                        $('.mousemoveX').html(mousemoveX);
                        $('.lastPosition').html(lastPosition);

                        lastPosition = mousemoveX;
                    }
                });

                // increase the size of the wrapper so we can handle exapanding the divs on hover
                // assuming only one 
                $('.hoverable').mouseover(function() {

                    if (winWidth > beerSliderThreshold) {

                        $beerWrapperInterior.css({
                            width: beerWidth * $beer.length + 85
                        });
                    }
                });
            });
        } //----end _gridViewOpen

        $beerWrapper.mouseleave(function() {

            if (winWidth > beerSliderThreshold) {

                if (animating == 1) {
                    stopAnimation();
                }
            }
        });
    }
    // END HOVERABLE

    //DRAGGABLE
    function initializeDraggableBeerSection() {

        console.log('touch and big window');

        $('.single-beer-wrap').removeClass('hoverable');

        Draggable.create($beerWrapperInterior, {

            type: "x",
            throwProps: true,
            bounds: "#beer-wrapper",
            edgeResistance: 0.65,
            dragClickables: true
        });
    }
    // END DRAGGABLE

    // UNTAPPD
    var checkinsArray = [];
    var beerID = 1234; // this needs to be updated for each page
    var breweryID = 117201; // Pigeon Hill Brewery
    var venueID = 1405081; // Pigeon Hill Brewery

    function checkSomeBeerIDs() {
        if (typeof $('#untappd-wrapper').data("beerid") !== "undefined") {
            beerID = $('#untappd-wrapper').data("beerid");
            createUntapped(beerID, "beer");
        }
    }

    function checkBreweryID() {
        if (typeof $('#untappd-wrapper').data("breweryid") !== "undefined") {
            breweryID = $('#untappd-wrapper').data("breweryid");
            createUntapped(breweryID, "brewery");
        }
    }

    function checkVenueID() {
        if (typeof $('#untappd-wrapper').data("venueid") !== "undefined") {
            venueID = $('#untappd-wrapper').data("venueid");
            createUntapped(venueID, "venue");
        }
    }

    function createUntapped(uid, utype) {
        $.getJSON("/untappd-cache/request.php?uid=" + uid + "&utype=" + utype, function(data) {

            jsonCall(data);

        }).fail(function(d, textStatus, error) {
            // in case the json fails for some reason display some error messages
            console.log("getJSON failed, status: " + textStatus + ", error: " + error);
            console.log(d);

        }); // end json call


        var jsonCall = function(data) {
            // when the json is returned store the level we want to grab info from
            var checkInData = data.response.checkins.items;

            // go through each of the sets of data
            $.each(checkInData, function(i) {

                //create an array to store the info we need         
                checkinArray = {
                    beer: checkInData[i].beer.beer_name,
                    bid: checkInData[i].beer.bid,
                    firstName: checkInData[i].user.first_name,
                    lastName: checkInData[i].user.last_name,
                    photo: checkInData[i].user.user_avatar,
                    date: checkInData[i].created_at,
                    time: checkInData[i].created_at,
                    venue: checkInData[i].venue.venue_name,
                    rating: checkInData[i].rating_score
                };

                // push this array to the global array to access later
                checkinsArray.push(checkinArray);
            });

            // once we do all that call the function to display the HTML on the page        
            outputuntappdHTML();
        };

        // create a function to display HTML from the UNTAPPD feed
        var outputuntappdHTML = function() {

            // go through each of the arrays in the checkinsArray object
            for (i = 0; i < checkinsArray.length; i++) {

                // store the info we need with the associated HTML
                avatar = '<div class = "avatar"><img src = "' + checkinsArray[i].photo + '"/></div>';
                name = checkinsArray[i].firstName + ' ' + checkinsArray[i].lastName;
                venue = '';
                date = moment(checkinsArray[i].date).format('MMMM Do');
                time = moment().format('h:mm a');
                rating = '';

                // if the date of the post matches todays date
                if (date === todaysDate) {

                    date = '<p class = "time">' + moment(checkinsArray[i].date).fromNow(true) + ' ago</p>';
                    beer = ' is drinking a <a href = "https://untappd.com/beer/' + checkinsArray[i].bid + '" target = "_blank">' + checkinsArray[i].beer + '</a>';

                }

                // if the date of the post matches yesterdays date
                else if (date === yesterdaysDate) {
                    date = '<p class = "time"> Yesterday at ' + time + '</p>';
                    beer = 'was drinking a <a href = "https://untappd.com/beer/' + checkinsArray[i].bid + '" target = "_blank">' + checkinsArray[i].beer + '</a>';
                }

                // if the date of the post doens't match yesterday or todays
                else {
                    date = '<p class = "time">' + date + ' at ' + time + '</p>';
                    beer = 'was drinking a <a href = "https://untappd.com/beer/' + checkinsArray[i].bid + '" target = "_blank">' + checkinsArray[i].beer + '</a>';
                }

                // if the venue is defined
                if (checkinsArray[i].venue !== undefined) {
                    venue = ' at ' + checkinsArray[i].venue;
                }

                // if the rating is defined
                if (checkinsArray[i].rating != '0') {
                    rating = '<div class = "stars stars-' + checkinsArray[i].rating.toString().replace('.', '') + '"></div>';
                }

                // append the html to the UL
                $('#untappd-feed').append('<li class = "post">' + avatar + '<div class = "user-info"><p> ' + name + beer + venue + '</p>' + rating + date + '</div><div class = "clear"></div></li>');
            }
        };
    }
    // END UPTAPPD

    // TOOLTIPSY
    $(function() {
        $('.no-touch .go-left .link-tip').tooltipsy({
            alignTo: 'element',
            offset: [.1, 0],
            delay: 0,
            css: {
                'margin-top': '-15px',
                'margin-left': '-55px'
            },
            show: function(e, $el) {
                $el.css({
                    'left': parseInt($el[0].style.left.replace(/[a-z]/g, '')) + 10 + 'px',
                    'opacity': '0.0',
                    'display': 'block'
                }).animate({
                    'left': parseInt($el[0].style.left.replace(/[a-z]/g, '')) - 10 + 'px',
                    'opacity': '1.0'
                }, 300);
            },
            hide: function(e, $el) {
                $el.css({
                    'left': parseInt($el[0].style.left.replace(/[a-z]/g, '')) + 0 + 'px',
                    'opacity': '1.0',
                }).animate({
                    'left': parseInt($el[0].style.left.replace(/[a-z]/g, '')) + 3 + 'px',
                    'opacity': '0.0'
                }, 100);
            }
        });

        $('.no-touch .go-right .link-tip').tooltipsy({
            alignTo: 'element',
            offset: [-.1, 0],
            delay: 0,
            css: {
                'margin-top': '-15px',
                'margin-right': '-55px',
                'text-align': 'right'
            },
            show: function(e, $el) {
                $el.css({
                    'left': parseInt($el[0].style.left.replace(/[a-z]/g, '')) - 10 + 'px',
                    'opacity': '0.0',
                    'display': 'block'
                }).animate({
                    'left': parseInt($el[0].style.left.replace(/[a-z]/g, '')) + 10 + 'px',
                    'opacity': '1.0'
                }, 300);
            },
            hide: function(e, $el) {
                $el.css({
                    'left': parseInt($el[0].style.left.replace(/[a-z]/g, '')) + 0 + 'px',
                    'opacity': '1.0',
                }).animate({
                    'left': parseInt($el[0].style.left.replace(/[a-z]/g, '')) - 3 + 'px',
                    'opacity': '0.0'
                }, 100);
            }
        });
    });
    // END TOOLTIPSY

    // GOOGLE MAP
    var infowindow = null;

    $(document).ready(function() {
        initialize();
    });

    function initialize() {

        var centerMap = new google.maps.LatLng(43.2339556, -86.2556952);

        var styles = [{
            "featureType": "administrative",
            "elementType": "all",
            "stylers": [{
                "visibility": "on"
            }, {
                "lightness": 33
            }]
        }, {
            "featureType": "landscape",
            "elementType": "all",
            "stylers": [{ // major land - bone
                "color": "#f5f4ef"
            }]
        }, {
            "featureType": "poi",
            "elementType": "geometry",
            "stylers": [{ // park squres - green
                "color": "#D2B44C"
            }]
        }, {
            "elementType": "labels.text.fill",
            "stylers": [{ // all text
                "color": "#494657"
            }]
        }, {
            "featureType": "poi.park",
            "elementType": "labels",
            "stylers": [{
                "visibility": "on"
            }, {
                "lightness": 20
            }]
        }, {
            "featureType": "road",
            "elementType": "all",
            "stylers": [{
                "lightness": 20
            }]
        }, {
            "featureType": "road.highway",
            "elementType": "geometry",
            "stylers": [{ // major highway - gray
                "color": "#c5c6c6"

            }]
        }, {
            "featureType": "road.arterial",
            "elementType": "geometry",
            "stylers": [{ // medium highway - light gray
                "color": "#e8e7e7"
            }]
        }, {
            "featureType": "road.local",
            "elementType": "geometry",
            "stylers": [{ // super tiny roads
                "color": "#e8e7e7"
            }]
        }, {
            "featureType": "water",
            "elementType": "all",
            "stylers": [{
                "visibility": "on"
            }, { // all water
                "color": "#F6DB7C"
            }],
        }, {
            "featureType": "water",
            "elementType": "labels.text.fill",
            "stylers": [{
                "visibility": "on"
            }, { // all water
                "color": "#494657"
            }]
        }];

        var mapOptions = {
            backgroundColor: "#f5f4ef",
            center: centerMap,
            disableDoubleClickZoom: true,
            mapTypeControl: false,
            mapTypeControlOptions: {
                mapTypeIds: ['Styled']
            },
            mapTypeId: 'Styled',
            scaleControl: false,
            scrollwheel: false,
            streetViewControl: false,
            zoom: 12,
            zoomControlOptions: {
                position: google.maps.ControlPosition.RIGHT_BOTTOM,
                style: google.maps.ZoomControlStyle.SMALL
            }
        }

        var map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);

        var styledMapType = new google.maps.StyledMapType(styles, {
            name: 'Styled'
        });

        map.mapTypes.set('Styled', styledMapType);

        setMarkers(map, sites);
        infowindow = new google.maps.InfoWindow({
            content: "loading..."
        });
    }

    var sites = [
        ['PH Brewing Co.', 43.2339556, -86.2556952]
    ];

    function setMarkers(map, markers) {

        for (var i = 0; i < markers.length; i++) {
            var sites = markers[i];
            var siteLatLng = new google.maps.LatLng(sites[1], sites[2]);
            var marker = new google.maps.Marker({
                clickable: false,
                icon: 'http://sleepingbeardesign.com/beer/img/marker-google.png',
                map: map,
                position: siteLatLng
            });
        }
    }
    // END GOOGLE MAP