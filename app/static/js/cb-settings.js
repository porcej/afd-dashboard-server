
/***

jQuery cb-settings - Settings handling for Chalkboard Dashboard
Copyright 2017 Joseph Porcelli
0.0.1

***/


(function ($, moment) {
    'use strict';

    var storageHandler = false;
    var settingsFields = {
        webstaff: ['station']
    }


    /* =========================================================================
    
    cb-settings - lets do some majic

    ========================================================================= */
    function cb_settings( settings ){
        
        if ( !hasSessionStorage() ){
            displayWarning("Unsupported browser", "We notice you are using an older browser. Some features on this site may not work correctly. We recommend you upgrade to a later version of this browser or switch to a different one.");
        } else {
            storageHandler = localStorage;

            if (!hasSettings()){
                displaySettings();
            }
        }
        
        return this;    // we support chaining
    }   // cb-settings()


    /* =========================================================================
    
    getCreds - Returns the creds for service

    ========================================================================= */
    function getCreds( service ){
        service = service || '';
        var retVals = {};

        if (settingsFields.hasOwnProperty(service)){
            var keys = settingsFields[service];
            for (var idx =0; idx < keys.length; idx++){
                var key = keys[idx];
                retVals[key] = loadValue(key);
            }
        }
        
        return retVals;
    }   // getCreds()


    /* =========================================================================
    
    getKeys - Returns a list of the keys in object, obj

    ========================================================================= */
    function getKeys(obj){
        var keys = [];
        for(var key in obj){
            if (obj.hasOwnProperty(key)){
                keys.push(key);
            }
        }
        return keys;
    }   // getKeys()

    /* =========================================================================
    
    hasSettings - Checks to see if all required settingsd are saved

    ========================================================================= */
    function hasSettings(){

        for (var key in settingsFields){
            if (settingsFields.hasOwnProperty(key)){
                for (var idx = 0; idx < settingsFields[key].length; idx++) {
                    if (loadValue(settingsFields[key][idx]) === null){
                        return false;
                    }
                }
            }
        }
        return true;
        
    }  // hasSettings()

    /* =========================================================================
    
    loadValue - an alias for storageHandler.getItem()

    ========================================================================= */
    function loadValue(key){

        return storageHandler.getItem(key);

    }  // loadValue()


    /* =========================================================================
    
    saveValue - an alias for storageHandler.setItem()

    ========================================================================= */
    function saveValue(key, val){

        return storageHandler.setItem(key, val);

    }  // saveValue()

    /* =========================================================================
    
    hasLocalStorage - Returns true if local storage is supported, 
                        false otherwise

    ========================================================================= */
    function hasLocalStorage(){
        var ls = 'ls';
        try {
            localStorage.setItem(ls, ls);
            localStorage.removeItem(ls);
            return true;
        } catch(e) {
            return false;
        }
    }  // hasLocalStorage()


    /* =========================================================================
    
    hasSessionStorage - Returns true if session storage is supported, 
                        false otherwise

    ========================================================================= */
    function hasSessionStorage(){
        var ls = 'ls';
        try {
            sessionStorage.setItem(ls, ls);
            sessionStorage.removeItem(ls);
            return true;
        } catch(e) {
            return false;
        }
    }  // hasSessionStorage()


    /* =========================================================================
    
    displayWarning - Displays a warning

    ========================================================================= */
    function displayWarning(title, msg){
        title = title || '';
        msg = msg || '';

        var modalID = "warningModal";

        var modal = $("<div/>").addClass("modal fade")
                               .attr("id", modalID)
                               .attr("tabindex", "-1")
                               .attr("role", "dialog")
                               .attr("aria-labelledby", "warningModalLabel")
                               .attr("aria-hidden", "true");

        modal.append(`
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                  <div class="modal-header bg-danger">
                    <h5 class="modal-title" id="warningModalLabel">
                        <strong><i class="fa fa-exclamation-triangle" aria-hidden="true"></i></strong> ` + title + `</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                      <span aria-hidden="true">&times;</span>
                    </button>
                  </div>
                  <div class="modal-body">
                  <p class="text-danger">` + msg + `</p>
                  </div>
                  <div class="modal-footer bg-muted">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                  </div>
                </div>
            </div>
            `);

        $( 'body' ).append( modal );
        $( '#' + modalID ).modal('show'); 

    }  // displayWarning()


    /* =========================================================================
    
    displaySettings - Displays settings modal

    ========================================================================= */
    function displaySettings(){


        var modalID = "settingsModal";

        var modal = $("<div/>").addClass("modal fade")
                               .attr("id", modalID)
                               .attr("tabindex", "-1")
                               .attr("role", "dialog")
                               .attr("aria-labelledby", modalID + "Label")
                               .attr("aria-hidden", "true");

        modal.append(`
<div class="modal-dialog" role="document">
    <div class="modal-content">
      <div class="modal-header bg-info">
        <h5 class="modal-title" id="` + modalID + `Label">Settings</h5>
        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body">
        <form class="form-settings">
            <!--  Staton Selection -->
            <div class="input-group">
                <span class="input-group-addon"><i class="fa fa-building fa-fw ltblue" aria-hidden="true"></i> <i class="fa fa-key fa-fw ltblue" aria-hidden="true"></i></span>
                <label class="sr-only" for="station">Station</label>
                  <select class="form-control" id="station" tabindex="7">
                    <option>201</option>
                    <option>202</option>
                    <option>203</option>
                    <option>204</option>
                    <option>205</option>
                    <option>206</option>
                    <option>207</option>
                    <option>208</option>
                    <option>209</option>
                    <option>210</option>
                  </select>
            </div>
        </form>
      </div>
      <div class="modal-footer bg-muted">
        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
        <button type="button" id="settings-save" class="btn btn-primary">Save</button>
      </div>
    </div>
</div>`);

        $( 'body' ).append( modal );

        for (var cat in settingsFields){
            if (settingsFields.hasOwnProperty(cat)){
                for (var idx = 0; idx < settingsFields[cat].length; idx++) {
                    var key = settingsFields[cat][idx];
                    var val = loadValue(key);
                    if (val !== null){
                        if ($('#'+key).prop('nodeName') == 'INPUT'){
                            $('#'+key).val(val);
                        } else if ($('#'+key).prop('nodeName') == 'SELECT'){
                            $('#' + key + ' option').filter(function(i, e) { return $(e).text() == val})
                                                    .attr('selected','selected');
                        }
                        // return false;
                    }
                }
            }
        }

        $('#settings-save').click(function(e){
            // registerActive911();
            for (var cat in settingsFields){
                if (settingsFields.hasOwnProperty(cat)){
                    for (var idx = 0; idx < settingsFields[cat].length; idx++) {
                        var key = settingsFields[cat][idx];
                        saveValue(key, $('#'+key).val());
                    }
                }
            }
            $( '#' + modalID ).modal('hide')
            location.reload();
        });


        // saveValue


        $( '#' + modalID ).modal('show');

    }   // displaySettings()


    // Now we export
    $.cb_settings = cb_settings;
    $.cb_settings.getCreds = getCreds;
    $.cb_settings.displaySettings = displaySettings;
    $.cb_settings.displayWarning = displayWarning;

})(jQuery, moment);
