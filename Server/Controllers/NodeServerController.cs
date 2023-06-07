using System;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using SOC.DataManagers;
using Newtonsoft.Json;

namespace SOC.Controllers
{
    [Route("api/[controller]")]
    [ApiController]

    public class NodeServerController : Controller
    {
        public static CustomLogger logger = new CustomLogger(@"C:\vsoc\logs", "nodeserver");
        [HttpGet]
        public async Task<ActionResult> Get()
        {
            try
            {
                if (Program.nodeManager.CheckAvailableNodeServerPort() == true)
                {
                    CustomLogger.Log(logger, "Node server is running");
                    return new ContentResult { Content = JsonConvert.SerializeObject(true), ContentType = "application/json" };
                }
                else
                {
                    //Waiting: the Node server is boot up (to 28 seconds)
                    NodeManager.count++;
                    if (NodeManager.count > 30)
                    {
                        NodeManager.count = 0;
                        CustomLogger.Log(logger, "Node server problems: boot up time exceeded 1000мс*30");
                        return new ContentResult { Content = JsonConvert.SerializeObject(false), ContentType = "application/json" };
                    }

                    await Task.Delay(1000);
                    return await Get();
                }
            }
            catch (Exception ex)
            {
                CustomLogger.Log(logger, "Node server problems: " + ex.Message);
                return new ContentResult { Content = JsonConvert.SerializeObject(false), ContentType = "application/json" };
            }
        }
    }
}