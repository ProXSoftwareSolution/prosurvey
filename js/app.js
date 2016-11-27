// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'survey' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('survey', ['ionic'])

.factory('Questions',['$http','$q','$rootScope' ,function($http,$q,$rootScope){

  var result = [];

    return {
        get : function(uuid, page) {

          var deferred = $q.defer();
          $http.get('http://proxsoftwaresolution.com/prosurvey/newquestions/'+uuid+'?page='+page)
            .success(function(data, status, headers, config) {
              // this callback will be called asynchronously
              // when the response is available
              result = JSON.parse(data);
              deferred.resolve(result);
            })
            .error(function(data, status, headers, config) {
              // called asynchronously if an error occurs
              // or server returns response with an error status.
              $rootScope.$broadcast('loading:hide');
              console.log('ERROR (questions):' + status);
              deferred.reject(result);
            });
          return deferred.promise;

        }
    };

}])


.run(function($ionicPlatform,$rootScope) {
  $ionicPlatform.ready(function() {
    if(window.cordova && window.cordova.plugins.Keyboard) {

      var uuid = device.uuid;
      window.localStorage.setItem('uuid',uuid);
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

      // Don't remove this line unless you know what you are doing. It stops the viewport
      // from snapping when text inputs are focused. Ionic handles this internally for
      // a much nicer keyboard experience.
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})

.run(function($rootScope, $ionicLoading) {
      $rootScope.$on('loading:show', function() {
        $ionicLoading.show({});
      });

      $rootScope.$on('loading:hide', function() {
        $ionicLoading.hide();
      });
})

.controller("HomeController", function($scope,$ionicModal,$rootScope,$timeout,$http,$window,$ionicPopup,Questions) {
  var API_URL = 'http://proxsoftwaresolution.com/prosurvey/';

    $timeout(function () {
          $scope.uuid =  window.localStorage.getItem('uuid');
    }, 3000);

    $scope.survey = {
                    'questions' : '',
                       'page'     : 1,
                   'totalPages'   : 1,
                    'correct' : '',
                    'question_id' : '',
                    'reason' : '',
                    'name' : $window.localStorage['name'] ,
                    'phone' : $window.localStorage['phone'] 
                  };
  
    $scope.nointernet = false;
    $scope.about = false;
    $scope.modaltitle = '';
    $scope.modaldescription = '';


    $ionicModal.fromTemplateUrl('popup.html', {
              scope: $scope,
              animation: 'slide-in-down'
      }).then(function(modal) {
              $scope.modal = modal;
      });
    
         $rootScope.$broadcast('loading:show');

         $timeout(function () {

           $scope.doRefresh();
            
         }, 3000);
          
    $scope.doRefresh = function(){
      $scope.survey.page = 1;
      $scope.nointernet = true;
      Questions.get($scope.uuid,$scope.survey.page)
            .then(function(data) {
              $rootScope.$broadcast('loading:hide');

               $scope.nointernet = false;
               $scope.survey.totalPages = data.last_page;    
               $scope.survey.questions = data.data;

              $scope.$broadcast('scroll.refreshComplete');
            });
    };

    $scope.moreDataCanBeLoaded = function(){
      return $scope.survey.totalPages > $scope.survey.page;
    }

    $scope.loadMore = function() {
      $scope.survey.page += 1;
      $scope.nointernet = true;
       Questions.get($scope.uuid,$scope.survey.page)
        .then(function(data) {  
          $scope.nointernet = false;  
          $scope.survey.totalPages = data.last_page;    
          var new_questions = data.data;
          $scope.survey.questions = $scope.survey.questions.concat(new_questions);
          $scope.$broadcast('scroll.infiniteScrollComplete');
        });
    }

    $scope.yesRight = function(question_id) {
      $scope.survey.question_id = question_id;
      $scope.survey.correct = 1;
        $scope.about = false;
        $scope.modaltitle = 'မွန္ေၾကာင္း ေထာက္ခံခ်က္';
        $scope.modal.show();    
    };

    $scope.noWrong = function(question_id) {
      $scope.survey.question_id = question_id;
      $scope.survey.correct = 0;
        $scope.about = false;
        $scope.modaltitle = 'မွားေၾကာင္း ေထာက္ခံခ်က္';
        $scope.modal.show();    
    };

    $scope.saveConfirm = function() {
        $scope.nointernet = false;
        $rootScope.$broadcast('loading:show');
        
        $window.localStorage['name'] = $scope.survey.name;
        $window.localStorage['phone'] = $scope.survey.phone;

          $http.post(API_URL + 'answers/'+$scope.uuid+'/'+$scope.survey.question_id, 
                { 
                    correct:$scope.survey.correct,
                    reason:$scope.survey.reason,
                    name:$scope.survey.name,
                    phone:$scope.survey.phone

               }).success(function(response){
              $rootScope.$broadcast('loading:hide');
                  var alertPopup = $ionicPopup.alert({
                       title: 'Success',
                       template: response.message
                     });
                     alertPopup.then(function(res) {
                           $window.location.reload(true)
                     });
          }).error(function(error,status){
               $scope.nointernet = true;

            $rootScope.$broadcast('loading:hide');
          });  

    };

    $scope.aboutus = function() {
        $scope.about = true;

        $scope.modaltitle = 'About Us';

        $scope.modaldescription =   '<div class="item item-avatar">'+
                                    '<img src="data:image/png;base64,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">'+
                                    '<h2>Pro-X</h2>'+
                                    '<p>Software Solution</p>'+
                                    '</div>'+

                                    '<a href="http://www.proxsoftwaresolution.com" class="item item-icon-left" style="text-align: left;">'+
                                    '<i class="icon ion-ios-world"></i>'+
                                    'www.proxsoftwaresolution.com'+
                                    '</a>'+

                                    '<a href="http://www.facebook.com/proxsoftwaresolution" class="item item-icon-left" style="text-align: left;">'+
                                    '<i class="icon ion-social-facebook"></i>'+
                                    'Our Facebook Page'+
                                    '</a>'+

                                    '<a href="mailto:proxsoftwaresolution@gmail.com" class="item item-icon-left" style="text-align: left;">'+
                                    '<i class="icon ion-email"></i>'+
                                    'Email Us'+
                                    '</a>'+

                                    '<a href="tel:09778915075" class="item item-icon-left" style="text-align: left;">'+
                                    '<i class="icon ion-ios-telephone"></i>'+
                                    '09 778915075'+
                                    '</a>';

        $scope.modal.show();    
        

    };

    $scope.closemodal = function() {
        
        $scope.modal.hide();    

    };

 
});
