$(document).ready(function() {
    // Always load IP info on page open.
    $('div.ipblock').removeClass('hidden');
    getDevInfo();

    // Always load passes on page load. 

    // Clean previous cells
    $('.ptbody').empty();
    // Get the only pass from dataUtility.json
    $.ajax({
        url: 'https://' + window.location.host + '/api/pass/main',
        type: 'GET',
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        async: false,
        success: function(msg) {
            parseMainPass(msg);
        }
    });
    // Get all passes from data.json
    $.ajax({
        url: 'https://' + window.location.host + '/api/pass',
        type: 'GET',
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        async: false,
        success: function(msg) {
            parseCollectedPasses(msg);
        }
    });
    // Periodic calls to API of device info
    setInterval(function(){ 
        if ($('tr#ip-tr').length && !$('div.ipblock').hasClass('hidden')) {
            $.ajax({
                url: 'https://' + window.location.host + '/api/addr',
                type: 'GET',
                contentType: 'application/json; charset=utf-8',
                dataType: 'json',
                async: false,
                success: function(msg) {
                    updateDeviceInfo(msg);
                }
            });
        }
    }, 30000 /*interval in ms*/);

});

$(document).on( "click", ".eye-open" , function() {
    $(this).addClass('hidden');
    $(this).parent().children('input:password').attr('type', 'text'); 
    $(this).next().removeClass('hidden');
}); 

$(document).on( "click",  ".eye-closed" , function() {
    $(this).addClass('hidden');
    $(this).parent().children('input:text').attr('type', 'password'); 
    $(this).prev().removeClass('hidden');
}); 

$(document).on( "click",  ".ip-edit" , function() {
    $('p#pingcallback').parent().addClass('hidden');
    $('span.ip-edit').addClass('hidden');
    $('span.ip-edit').parent().children('input:text').prop('readonly', false);
    $('span.ip-cancel').removeClass('hidden');
    $('span.ip-confirm').removeClass('hidden');
}); 

$(document).on( "click",  ".ip-confirm" , function() {
    $('span.ip-confirm').addClass('hidden');
    $('span.ip-cancel').addClass('hidden');
    $('span.ip-cancel').parent().children('input:text').prop('readonly', true);
    $('span.ip-edit').removeClass('hidden');
    UpdateIP();
}); 

$(document).on( "click",  ".ip-cancel" , function() {
    $('input.ipholder').val(window.location.host.split(":")[0]);
    $('span.ip-cancel').addClass('hidden');
    $('span.ip-confirm').addClass('hidden');
    $('span.ip-cancel').parent().children('input:text').prop('readonly', true);
    $('span.ip-edit').removeClass('hidden');

});

function updatePasses() {
    var collection = [];
    $( "input.passholder:not(#mpass)" ).each(function( index ) {
        collection.push({ 'service': $('tr#pkey-' + (index+1) + '> td > p').html(), 'value': $( this ).val()});
    });
    $.ajax({
        url: 'https://' + window.location.host + '/api/pass',
        type: 'POST',
        data: JSON.stringify(collection),
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        async: false,
        success: function(msg) {
        }
    });
};

function updateMainPass() {
    var collection = { 'domain': 'Основная', 'password':  $('input#mpass').val()};
    $.ajax({
        url: 'https://' + window.location.host + '/api/pass/main',
        type: 'POST',
        data: JSON.stringify(collection),
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        async: false,
        success: function(msg) {
            $( "input.passholder" ).each(function( index ) {
                $( this ).prop('readonly', true);
            });
            $('a#passes-cancel').removeClass('btn-outline-primary');
            $('a#passes-cancel').addClass('btn-outline-secondary disabled');
        }
    });
};

function updateDeviceInfo(msg) {
    var currentElement = $('.ipbody');
    var IPholder = $('input.ipholder');
    var proxyStatHolder = $('p#proxystatus');
    var mpStatHolder = $('p#mpstatus');
    var ciscoStatHolder = $('p#vpnstatus');

    IPholder.val(msg['ipStr']); 
    proxyStatHolder.html(msg['proxy'].toUpperCase());
    mpStatHolder.html(msg['multiplayer'].toUpperCase());
    ciscoStatHolder.html(msg['vpn'].toUpperCase());

    /* loading status color*/
    LoadStatusColorDeviceInfo(msg);
}

function LoadStatusColorDeviceInfo(msg) {

    $('#proxystatus').removeClass('text-on text-off text-start');
    $('#mpstatus').removeClass('text-on text-off text-start');
    $('#vpnstatus').removeClass('text-on text-off text-start');

    /*  For proxy:*/    
    if (msg['proxy'] == "on") {$('#proxystatus').addClass('text-on');}
    else if (msg['proxy'] == "off") {$('#proxystatus').addClass('text-off');}
    else {$('#proxystatus').addClass('text-start');}

    /*  For Multiplayer:*/    
    if (msg['multiplayer'] == "on") {$('#mpstatus').addClass('text-on');}
    else if (msg['multiplayer'] == "off") {$('#mpstatus').addClass('text-off');}
    else {$('#mpstatus').addClass('text-start');}
    
    /*  For VPN:*/    
    if (msg['vpn'] == "on") {$('#vpnstatus').addClass('text-on');}
    else if (msg['vpn'] == "off") {$('#vpnstatus').addClass('text-off');}
    else {$('#vpnstatus').addClass('text-start');}
    
}


function parseDeviceInfo(msg) {
    var currentElement = $('.ipbody');
    var trString = $(`
        <tr id='ip-tr'>
            <th class='align-middle'>
                <p>IP</p>
            </th> 
            <td class='align-middle'>                                 
                <div class='input-group'> 
                    <input type='text' class='ipholder form-control' id='' placeholder='172.16.0.' readonly> 
                    <span class='ip-edit input-group-text' data-bs-toggle='tooltip' data-bs-placement='right' title='Изменить IP-адрес'><img src='./svg/pencil.svg'></span> 
                    <span class='ip-confirm input-group-text hidden' data-bs-toggle='tooltip' data-bs-placement='bottom' title='Подтвердить изменения'>Подтвердить</span>   
                    <span class='ip-cancel input-group-text hidden' data-bs-toggle='tooltip' data-bs-placement='right' title='Отменить изменения'>Отменить изменения</span> 
                </div>      
            </td> 
        </tr>
        <tr id='proxy-tr'>
            <th class='align-middle'>
                <p>Proxy</p>
            </th> 
            <td>                                 
                <div class='input-group'> 
                    <p class='' id='proxystatus'>${msg['proxy'].toUpperCase()}</p>
                </div>      
            </td> 
        </tr>
        <tr id='mp-tr'>
            <th class='align-middle'>
                <p>Multiplayer</p>
            </th> 
            <td class='align-middle'>                                 
                <div class='input-group'> 
                    <p class='' id='mpstatus'>${msg['multiplayer'].toUpperCase()}</p>
                </div>      
            </td> 
        </tr>
        <tr id='vpn-tr'>
            <th class='align-middle'>
                <p>Sigma VPN</p>
            </th> 
            <td class='align-middle'>                                 
                <div class='input-group'> 
                    <p class='' id='vpnstatus'>${msg['vpn'].toUpperCase()}</p>
                </div>      
            </td>
        </tr>  
        <tr class='border-transparent'>
            <td colspan="3" class='hidden pt-4 px-0'>
                <p class='errorstate' id='pingcallback'>Адрес уже занят</p>
            </td> 
        </tr> 
    `);

    $(trString).appendTo(currentElement);
    LoadStatusColorDeviceInfo(msg);
    $('input.ipholder').val(msg['ipStr']);  
}

function parseCollectedPasses(msg) {
    var currentElement = $('.ptbody');
    $.each(msg, function(i, item) {
        // 'source' is obsolete for frontend.
        // we don't use 'username' for this increment
        var name = item['linkName'].replace(/\0/g, '');
        var trString = $("<tr id='pkey-" + (i+1) + "'>" +
                            "<th class='align-middle'><p class=''>" + name + "</p></th>" +
                                "<td class='align-middle'>" +                                
                                "<div class='input-group'>" +
                                    "<input type='password' class='passholder form-control' id='p-" + (i+1) + "' placeholder='Пароль' readonly>" +
                                    "<span class='eye-open input-group-text' data-bs-toggle='tooltip' data-bs-placement='right' title='Показать пароль'><img src='./svg/eye.svg'></span>" +
                                    "<span class='eye-closed input-group-text hidden' data-bs-toggle='tooltip' data-bs-placement='right' title='Скрыть пароль'><img src='./svg/eye-closed.svg'></span>" + 
                                 "</div>" +     
                            "</td>" +
                        "</tr>");
        
        $(trString).appendTo(currentElement);
        $('input#p-' + (i+1)).val(item['parameters']['password']);
    });
}

function parseMainPass(msg) {
    var title = 'Основная';
    var trString = $("<tr id='localKey'>" +
                        "<th class='align-middle'><p class=''>" + title + "</p></th>" +
                            "<td class='align-middle'>" +                                
                            "<div class='input-group'>" +
                                "<input type='password' class='passholder form-control' id='mpass' placeholder='Пароль' readonly>" +
                                "<span class='eye-open input-group-text' data-bs-toggle='tooltip' data-bs-placement='right' title='Показать пароль'><img src='./svg/eye.svg'></span>" +
                                "<span class='eye-closed input-group-text hidden' data-bs-toggle='tooltip' data-bs-placement='right' title='Скрыть пароль'><img src='./svg/eye-closed.svg'></span>" + 
                                "</div>" +     
                        "</td>" +
                    "</tr>");
        
    $(trString).appendTo($('.ptbody'));
    $('input#mpass').val(msg['password']);
}

function UpdateIP() {
    var data = { 
        'ip': $('input.ipholder').val()
    };
    $.ajax({
        url: 'https://' + window.location.host + '/api/ping',
        type: 'POST',
        async: false,
        dataType: 'json',
        contentType: 'application/json; charset=utf-8',
        data: JSON.stringify(data),
        success: function(msg) {
            var errP = $('p#pingcallback');
            if (msg['error'] == true)
            {
                errP.html(msg['response']);
                errP.removeClass('oktext');
                errP.addClass('errorstate');

                $('input.ipholder').val(window.location.host.split(":")[0]);
                errP.parent().removeClass('hidden');
                $('a#network').html('Подтвердить и сохранить');
            }
            else
            {
                errP.html(msg['response']);
                errP.parent().removeClass('hidden');
                errP.removeClass('errorstate');
                errP.addClass('oktext');
                
                $('a#network').html('Изменить сетевые настройки');
                // Redirect to the new address
                setTimeout(function(){  window.location.href = 'https://' + $('input.ipholder').val() + ':' + location.port + '/index.html'; }, 15000);
            }
        }
    });
}


$(document).ready(function() {

    $('a#passes-cancel').click(function(e) {
        $( "input.passholder" ).each(function( index ) {
            $( this ).prop('readonly', true);
        });

        $('a#passes').html("Изменить пароли");
        $('a#passes-cancel').removeClass('btn-outline-primary');
        $('a#passes-cancel').addClass('btn-outline-secondary disabled');

        // Clean previous cells
        $('.ptbody').empty();
        // Get the only pass from dataUtility.json
        $.ajax({
            url: 'https://' + window.location.host + '/api/pass/main',
            type: 'GET',
            contentType: 'application/json; charset=utf-8',
            dataType: 'json',
            async: false,
            success: function(msg) {
                parseMainPass(msg);
            }
        });
        // Get all passes from data.json
        $.ajax({
            url: 'https://' + window.location.host + '/api/pass',
            type: 'GET',
            contentType: 'application/json; charset=utf-8',
            dataType: 'json',
            async: false,
            success: function(msg) {
                parseCollectedPasses(msg);
            }
        });
    });
});

$(document).ready(function() {

    $('a#passes').click(function(e) {
        e.preventDefault(); 
        $('div.passblock').removeClass('hidden');
        text = $(this).html();
        if (text != "Изменить пароли")
        {
            $(this).html("Изменить пароли");
            // Add pass changing logic here!
            updatePasses();
            updateMainPass();
        }
        else
        {
            $('a#passes-cancel').removeClass('btn-outline-secondary disabled');
            $('a#passes-cancel').addClass('btn-outline-primary');
            // Clean previous cells
            $('.ptbody').empty();
            // Get the only pass from dataUtility.json
            $.ajax({
                url: 'https://' + window.location.host + '/api/pass/main',
                type: 'GET',
                contentType: 'application/json; charset=utf-8',
                dataType: 'json',
                async: false,
                success: function(msg) {
                    parseMainPass(msg);
                }
            });
            // Get all passes from data.json
            $.ajax({
                url: 'https://' + window.location.host + '/api/pass',
                type: 'GET',
                contentType: 'application/json; charset=utf-8',
                dataType: 'json',
                async: false,
                success: function(msg) {
                    parseCollectedPasses(msg);
                }
            });
            $(this).html("Подтвердить и сохранить");
            // Allow pass changing
            $( "input.passholder" ).each(function( index ) {
                $( this ).prop('readonly', false);
            });
        }
    });

});

function getDevInfo() {
    // Clean previous cells
    $('.ipbody').empty();
    $(this).html("Подтвердить и сохранить");
    // Add data getting blocke here.
    $.ajax({
        url: 'https://' + window.location.host + '/api/addr',
        type: 'GET',
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        async: false,
        success: function(msg) {
            parseDeviceInfo(msg);
        }
    });
}

$('btn#btn-network').bind('click', function(){
    e.preventDefault(); 

    UpdateIP();

});