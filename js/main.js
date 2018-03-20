'use strict';
var googleMapApp = angular.module('googleMapApp', ['ngRoute', 'ngAutocomplete']);

googleMapApp.config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
    $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
    });

    $routeProvider.when('/', {
        templateUrl: 'views/home.html',
        controller: 'PersonController'
    }).when('/peopleList', {
        templateUrl: 'views/peopleList.html',
        controller: 'PersonController'
    }).otherwise({
        redirectTo: '/'
    });

}]);


googleMapApp.service('PersonService', function () {
    var people = [];
    var lastPerson = {
        fullName: '',
        address: '',
        email: '',
        phone: '',
        website: '',
        place: []
    };
    var infobox = {};
    this.lastPlace = [];
    this.people = loadLocalStorage();
    this.map = {};

    function loadLocalStorage() {
        for (var i = 0; i < localStorage.length; i += 1) {
            var person = localStorage.getItem(localStorage.key(i));
            people.push(JSON.parse(person));
        }
        return people;
    };
});

googleMapApp.controller('PersonController', ['$scope', '$http', 'PersonService', function ($scope, $http, PersonService) {
    $scope.fullNameRegex = "^[A-Za-z\\s]{1,}[\\.]{0,1}[A-Za-z\\s]{0,}$";
    $scope.phoneNumberRegex = "^[0]\\d{9}$";
    // localStorage.clear();
    $scope.people = PersonService.people;
    $scope.submitData = function (person) {
        if (typeof (Storage) !== "undefined") {
            if (localStorage.getItem(person.email)) {
                updatePersonStatus(person, PersonService, $scope);
                return;
            } else {
                updatePersonStatus(person, PersonService, $scope);
                $scope.people.push(PersonService.lastPerson);
                return;
            }
        } else {
            document.getElementById("result").innerHTML = "Sorry, your browser does not support Web Storage...";
        }
    };
}]);

googleMapApp.directive('myMap', ['PersonService', function (PersonService) {
    return {
        restrict: "E",
        template: '<div></div>',
        replace: true,
        scope: {
            person: "=",
        },
        controller: function ($scope) {
            //Ruse coordinates
            var myLatLng = new google.maps.LatLng(43.8563889, 25.9708333);
            var mapOptions = {
                center: myLatLng,
                zoom: 12,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };
            var map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

            var marker = new google.maps.Marker({
                position: myLatLng,
                map: map,
                title: 'Ruse'
            });
            marker.setMap(map);
            PersonService.map = map;

            var input = document.getElementById('address');
            var searchBox = new google.maps.places.SearchBox(input);
            PersonService.lastPlace = searchBox;

            // map.addListener('bounds_changed', function () {
            //     searchBox.setBounds(map.getBounds());
            // });
            // var markers = [];

            // searchBox.addListener('places_changed', function () {
            //     var places = searchBox.getPlaces();
            //     markers.forEach(function (marker) {
            //         marker.setMap(null);
            //     });
            //     markers = [];

            //     var bounds = new google.maps.LatLngBounds();
            //     places.forEach(function (place) {
            //         alert(JSON.stringify(place.geometry));

            //         PersonService.lastPerson.place = place;
            //         alert(JSON.stringify(PersonService.lastPerson));
            //         if (!place.geometry) {
            //             console.log("Returned place contains no geometry");
            //             return;
            //         }
            //         var icon = {
            //             url: place.icon,
            //             size: new google.maps.Size(71, 71),
            //             origin: new google.maps.Point(0, 0),
            //             anchor: new google.maps.Point(17, 34),
            //             scaledSize: new google.maps.Size(25, 25)
            //         };
            //         marker = new google.maps.Marker({
            //             map: map,
            //             icon: icon,
            //             title: 'asd',
            //             position: place.geometry.location
            //         });
            //         // Create a marker for each place.
            //         // markers.push(new google.maps.Marker({
            //         //     map: map,
            //         //     icon: icon,
            //         //     title: place.name,
            //         //     position: place.geometry.location
            //         // }));
            //         if (place.geometry.viewport) {
            //             bounds.union(place.geometry.viewport);
            //         } else {
            //             bounds.extend(place.geometry.location);
            //         }
            //     });
            //     map.fitBounds(bounds);
            // });
        }
    };
}]);

function updateMap(PersonService) {
    var input = document.getElementById('address');
    var map = PersonService.map;

    map.addListener('bounds_changed', function () {
        PersonService.lastPlace.setBounds(map.getBounds());
    });

    var places = PersonService.lastPlace.getPlaces();

    var bounds = new google.maps.LatLngBounds();
    places.forEach(function (place) {
        if (!place.geometry) {
            console.log("Returned place contains no geometry");
            return;
        }
        var icon = {
            url: place.icon,
            size: new google.maps.Size(71, 71),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(17, 34),
            scaledSize: new google.maps.Size(25, 25)
        };
        var marker = new google.maps.Marker({
            map: map,
            icon: icon,
            title: 'asd',
            position: place.geometry.location
        });

        marker.addListener('click', function () {
            if (PersonService.lastPerson) {

                PersonService.lastPerson.infoBox = '<div id="infoBox"><h5>' +
                    '<p>' + PersonService.lastPerson.fullName + '</p>' +
                    '<p>' + PersonService.lastPerson.email + '</p>' +
                    '<p>' + PersonService.lastPerson.phone + '</p>' +
                    '<p>' + PersonService.lastPerson.website + '</p>' +
                    '</h5></div>';
                var infowindow = new google.maps.InfoWindow({
                    content: PersonService.lastPerson.infoBox
                });
                infowindow.open(map, marker);
            }
        });

        if (place.geometry.viewport) {
            bounds.union(place.geometry.viewport);
        } else {
            bounds.extend(place.geometry.location);
        }
    });
    map.fitBounds(bounds);
};

function updatePersonStatus(person, PersonService, $scope) {
    document.getElementById('resetButton').click();
    localStorage.setItem(person.email, JSON.stringify(person));
    PersonService.lastPerson = JSON.parse(JSON.stringify(person));
    $scope.lastPerson = JSON.parse(JSON.stringify(person));
    updateMap(PersonService);
    return;
}