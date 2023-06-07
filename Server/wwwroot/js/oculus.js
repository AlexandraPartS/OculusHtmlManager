/*********************************************************************/
/*          Copyright (c) NTC-Vulkan. All rights reserved            */
/* Файл js для работы с adb и npm                                    */
/* Содержание (в соотв.порядке):
    1. adb - запросы к api для вывода данных и возможных ошибок
    2. npm-castStream - вывод видеопотока (используется ws-scrcpy)
       (панель "droid_device_list" скрывается здесь: stream.css: #devices {display: none;})
/*********************************************************************/

$(document).ready(function () {

    checkingNodeServerAvailable();

    getADBInfo();

    setInterval(function(){
        getADBInfo();
    }, 5000);

    //Работа с кнопками включения/выключения трансляции
    $('a#translation-open').click(function () {
        $('a#translation-open').addClass('disabled');
        $('a#translation-cancel').removeClass('btn-outline-secondary disabled').addClass('btn-outline-primary');
    });
    $('a#translation-cancel').click(function () {
        $('a#translation-open').removeClass('disabled');
        $('a#translation-cancel').addClass('btn-outline-secondary disabled').removeClass('btn-outline-primary');
    });

} );

async function checkingNodeServerAvailable() {
    var serverNode = false;
    if (sessionStorage.getItem('NodeState') != null) {
        serverNode = sessionStorage.getItem('NodeState'); //To dev: this is must be cleared on shutdown VSOC
        document.getElementsByClassName('preloader')[0].remove();
    }
    if (!serverNode) {
        //waiting for the server
        let result = await waitNodeServer(); 
        if (result == true) {
            sessionStorage.setItem('NodeState', 'true'); //To testing in browser console: localStorage.removeItem('serverNode');
            location.reload();
        }
        else {
            //create infoblock & than remove preloader
            let elem = document.getElementById('errormsg');
            let p = document.createElement('p');
            p.classList.add("errorstate", "errorstatenode");
            p.innerHTML = `Проблемы с видеотрансляцией. Попробуйте перезагрузить страницу.`;
            elem.after(p);
            document.getElementsByClassName('preloader')[0].remove();
        }
    }
}

function waitNodeServer() {
    return $.ajax({
        url: 'https://' + window.location.host + '/api/NodeServer',
        type: 'GET',
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        async: false
    });
}

function getADBInfo() {
    $.ajax({
        url: 'https://' + window.location.host + '/api/adb',
        type: 'GET',
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        async: false,
        success: function (msg) {
            parseDeviceInfo(msg);
        }
    });
}

function parseDeviceInfo(msg) {

    $('.adbmsg, #serverstatus, #ipstatus, #modelstatus, #lcontroller-charge, #glasses-charge, #rcontroller-charge').empty();

    //Все ошибки из adb (3 категории) объединены сейчас и выводятся одной ошибкой, т.е. нет случая их перечисления:
    if (msg['ip'].includes("error: ") || msg['ip'].includes("ERROR: ") || msg['ip'] == "" || msg['ip'].substring(0, 3) != "172" || msg['ip'].substring(0, 8) != "adb.exe:") {

        $('p#errormsg').removeClass('hidden');
        $('.adbmsg').remove(); //убрать в случае перечисления ошибок

        //Case 1: No device - there is nothing
        if (msg['ip'] == "error: no devices/emulators found\r\n" || msg['ip'] == "ошибка: устройства / эмуляторы не найдены \ r \ n" || msg['ip'] == "adb.exe: no devices/emulators found\r\n") {
            textmsg = "Устройство не обнаружено. Убедитесь, что очки Oculus подключены к ПК посредством USB.";
            $("<span>—</span>").appendTo('#serverstatus, #ipstatus, #modelstatus, #lcontroller-charge, #glasses-charge, #rcontroller-charge');
        }

        //Case 2: adb doesn't installed - there is nothing
        else if (msg['ip'] == "ERROR: Не удается найти указанный файл.") {
            textmsg = "Не удалось найти файл adb.exe.";
            $("<span>—</span>").appendTo('#serverstatus, #ipstatus, #modelstatus, #lcontroller-charge, #glasses-charge, #rcontroller-charge');
        }

        //Case 3 (одиннаковые сообщения, но с разных ресурсов: одно приходит с сервера scrcpy при работе с npm, другое - c ADBController)
        //"adb.exe: устройство неавторизовано. \ r \ nДанный параметр $ ADB_VENDOR_KEYS этого сервера adb не установлен \ r \ nПопробуйте 'adb kill-server', если это кажется неправильным. \ r \ nВ противном случае проверьте наличие диалогового окна подтверждения на вашем устройстве"
        else if (msg['ip'] == "error: device unauthorized.\r\nThis adb server's $ADB_VENDOR_KEYS is not set\r\nTry 'adb kill-server' if that seems wrong.\r\nOtherwise check for a confirmation dialog on your device.\r\n" || msg['ip'] == "adb.exe: device unauthorized.\r\nThis adb server's $ADB_VENDOR_KEYS is not set\r\nTry 'adb kill-server' if that seems wrong.\r\nOtherwise check for a confirmation dialog on your device.\r\n") {
            textmsg = 'Устройство неавторизовано. <br/>\n' + 
                '1. Убедитесь, что устройство включено. <br/>\n' +
                '2. Убедитесь, что работа с данными устройства подтверждена. Для этого при включенных очках в диалоговых окнах \"Отладка по USB\" и \"Разрешить доступ к данным\" нажмите на кнопку \"Разрешить\".';
            var isConnect = $(`
            <span class='server-confirm server-confirm-none' ></span>
            <span>Нет подключения</span>`);
            var model = $(`<span>${msg['devicename']}</span>`);
            $(model).appendTo('#modelstatus');
            $("<span>—</span>").appendTo('#ipstatus, #lcontroller-charge, #glasses-charge, #rcontroller-charge');
        }

        //Case 4: catch another possible errors that should be displayed in the error place
        //1) errors that were not included in the list for the task
        //2) errors that were not see during testing
        else if (msg['ip'].includes('error') || msg['ip'].includes('ошибка')) {
            textmsg = msg['ip'];
            $("<span>—</span>").appendTo('#serverstatus, #ipstatus, #modelstatus, #lcontroller-charge, #glasses-charge, #rcontroller-charge');
        }

        //Case 5: No network (No IP) 
        else if (msg['ip'] == "") {
            $('p#errormsg').removeClass('hidden');
            textmsg = "Не определен ip-адрес. Проверьте подключение к Wi-Fi.";
            var isConnect = $(`
            <span class='server-confirm server-confirm-none'></span>
            <span>Нет подключения</span>`);
            var model = $(`<span>${msg['devicename']}</span>`);
            var currentIP = $(`<span>${msg['ip']}</span> `);
            // var lcontrollerChargeStatus = $(`<span>${msg['battery_lcontroller']}</span>`);
            var helmetChargeStatus = $(`<span>${msg['battery_oculus']}</span> `);
            // var rcontrollerChargeStatus = $(`<span>${msg['battery_lcontroller']}</span>`);
            $(model).appendTo('#modelstatus');
            $(currentIP).appendTo('#ipstatus');
            // $(lcontrollerChargeStatus).appendTo('#lcontroller-charge');
            $(helmetChargeStatus).appendTo('#glasses-charge');
            // $(rcontrollerChargeStatus).appendTo('#rcontroller-charge');
        }
        //Case 6: No network (IP) - 
        else if (msg['ip'].substring(0, 3) != "172") {
            textmsg = "Неверно задан ip-адрес. Для работы с ВСЦ IP-адрес сервера должен быть в рамках подсети 172.16.0.0/32. Вы можете скорректировать IP-адрес на странице \"Панель управления VSOC\" в разделе \"Сетевые настройки\".";
            var isConnect = $(`
            <span class='server-confirm server-confirm-ok'></span>
            <span>Подключено</span>`);
            var model = $(`<span>${msg['devicename']}</span>`);
            var currentIP = $(`<span>${msg['ip']}</span> `);
            // var lcontrollerChargeStatus = $(`<span>${msg['battery_lcontroller']}</span>`);
            var helmetChargeStatus = $(`<span>${msg['battery_oculus']}</span> `);
            // var rcontrollerChargeStatus = $(`<span>${msg['battery_lcontroller']}</span>`);
            $(model).appendTo('#modelstatus');
            $(currentIP).appendTo('#ipstatus');
            // $(lcontrollerChargeStatus).appendTo('#lcontroller-charge');
            $(helmetChargeStatus).appendTo('#glasses-charge');
            // $(rcontrollerChargeStatus).appendTo('#rcontroller-charge');
        }

        //Case 7: more than one device/emulator
        if (msg['ip'] == "error: more than one device/emulator\r\n") {
            textmsg = "Подключено более одного устройства. Подключите только одни очки Oculus к ПК.";
        }

        //Case 8: No controller - 
        // else if()
        // {

        // }

        var spanFirst = $("<span class='adbmsg'>" + textmsg + "</span>");
        $('p#errormsg').prepend(spanFirst); // вставить spanFirst в начало <p>
    }

    //Case 8: everything is OK!!! (working)
    else
    {
        //$('p#errormsg').addClass('hidden');
        $('span.adbmsg').remove();
        var isConnect = $(`
            <span class='server-confirm server-confirm-ok' ></span>
            <span>Подключено</span>
        `);
        var model = $(`<span>${msg['devicename']}</span>`);
        var currentIP = $(`<span>${msg['ip']}</span> `);
        // var lcontrollerChargeStatus = $(`<span>${msg['battery_lcontroller']}</span>`);
        var helmetChargeStatus = $(`<span>${msg['battery_oculus']}</span> `);
        // var rcontrollerChargeStatus = $(`<span>${msg['battery_lcontroller']}</span>`);
        $(model).appendTo('#modelstatus');
        $(currentIP).appendTo('#ipstatus');
        // $(lcontrollerChargeStatus).appendTo('#lcontroller-charge');
        $(helmetChargeStatus).appendTo('#glasses-charge');
        // $(rcontrollerChargeStatus).appendTo('#rcontroller-charge');
    }

    $(isConnect).appendTo('#serverstatus');
    
    //battery check for GUI 
    if (Number(msg['battery_oculus']) < 40) { $('#glasses-charge').parent().addClass('alert-danger'); } else { $('#glasses-charge').parent().removeClass('alert-danger'); }
    //if(Number(msg['battery_lcontroller']) < 40) {$('#lcontroller-charge').parent().addClass('alert-danger');}else{$('#lcontroller-charge').parent().removeClass('alert-danger');}
    //if(Number(msg['battery_rcontroller']) < 40) {$('#rcontroller-charge').parent().addClass('alert-danger');}else{$('#rcontroller-charge').parent().removeClass('alert-danger');}

    if ($('p#errormsg').childElementCount == 0) {
        $('p#errormsg').addClass('hidden');
    }
}