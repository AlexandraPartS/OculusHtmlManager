using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using System.IO;
using Medallion.Shell;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json;

// Класс для получения данных с Oculus (имя устройства (ID), IP, заряд)  посредством adb.
// Закоммичены значения зарядов контроллеров - они нужны, то получение значений иное.

namespace SOC.Controllers
{
    public struct adbinfo
    {
        public string ip;
        public string devicename;
        //public string battery_lcontroller;
        public string battery_oculus;
        //public string battery_rcontroller;
    }

    [Route("api/[controller]")]
    [ApiController]
    public class ADBController : Controller
    {
        /// <summary>
        /// Метод для запуска exe файла (параметр executor) со списком аргументов (arguments).
        /// Метод: 1) запускает exe файл
        /// 2) Проверяет на ошибки try-catch. Поскольку здесь запускаются определенные exe файлы с опред.аргументами, то выполняется кастомный парсинг для каждой инструкции.
        /// 3) Результатом возвращается ответ в json-формате: либо выполненного запроса, либо оформленный текст ошибки
        /// </summary>
        public JObject ExecuteCommand(string executor, List<string> arguments)
        {
            JObject answer = new JObject { };
            try
            {
                var command = Command.Run(executor, arguments.ToArray());

                // wait for it to finish
                var result = command.Result;

                // inspect the result
                if (result.Success)
                {
                    answer["result"] = result.StandardOutput;

                    // Parse the answer data according to command
                    if ( arguments.Find( argument => argument == "devices") != null )
                    {
                        // Кастомный парсинг полученного ответа для команды adb devices -l 
                        // Сначала разбиваем строку на \r\n (подстроки), дальше определяем нужную нам строку и режем ее
                        string parsed = answer["result"].ToString().Split("\r\n")[1];
                        parsed = parsed.Split(" ")[0];
                        answer["result"] = parsed;
                    }
                    else if (arguments.Find(argument => argument == "ip") != null)
                    {
                        answer["result"] = answer["result"].ToString().Replace("\r\n", string.Empty);
                    }
                    else if (arguments.Find(argument => argument == "battery") != null)
                    {
                        answer["result"] = answer["result"].ToString().Replace(" ", string.Empty).Replace("\r\n", string.Empty);
                    }
                }
                else
                {
                    answer["result"] = result.StandardError;
                    answer["exitcode"] = result.ExitCode;
                }

            }
            catch (Exception e)
            {
                answer["result"] = "ERROR: " + e.Message;
            }

            return answer;
        }
        
        [HttpGet]
        public ActionResult Get()
        {

            List<string> netArguments = new List<string>
            {
                 //adb shell ip a show wlan0 | grep inet | head -1 | cut -d ' ' -f 6 - определение IP
                "shell",
                "ip",
                "a",
                "show",
                "wlan0",
                "|",
                "grep",
                "inet",
                "|",
                "head",
                "-1",
                "|",
                "cut",
                "-d",
                "' '",
                "-f",
                "6"
            };

            List<string> devicenameArguments = new List<string>
            {
                "devices",
                "-l"
            };

            //adb shell dumpsys battery | grep level | cut -d ':' -f 2
            List<string> batteryArguments = new List<string>
            {
                "shell",
                "dumpsys",
                "battery",
                "|",
                "grep",
                "level",
                "|",
                "cut",
                "-d",
                "':'",
                "-f",
                "2"
            };

            adbinfo info = new adbinfo {
                ip = ExecuteCommand("adb", netArguments)["result"].ToString(),
                devicename = ExecuteCommand("adb", devicenameArguments)["result"].ToString(),
                battery_oculus = ExecuteCommand("adb", batteryArguments)["result"].ToString(),
            };

            netArguments.Clear();
            devicenameArguments.Clear();
            batteryArguments.Clear();

            return new ContentResult { Content = JsonConvert.SerializeObject(info, Formatting.Indented), ContentType = "application/json" };

        }

    }
}
