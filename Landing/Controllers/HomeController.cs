using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Landing.Controllers
{
    public class HomeController : Controller
    {
        public ActionResult BetaAlready()
        {
            return View();
        }

        public ActionResult BetaSuccess() { return View(); }

        public ActionResult BetaThankYou() { return View(); }
        public ActionResult Book() { return View(); }

        public ActionResult Index()
        {
            return View();
        }

        public ActionResult About()
        {
            ViewBag.Message = "What we're all about.";

            return View();
        }

        public ActionResult Contact()
        {
            ViewBag.Message = "Contact Us.";

            return View();
        }

        public ActionResult Beta()
        {

            return View();
        }
    }
}