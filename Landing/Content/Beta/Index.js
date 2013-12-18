//holds the current user
var UserObj = {
    currentStep: 1,
    email: "",
    fName: "",
    lName: ""
};

function Service(client, name) {
    this._client = client;

    this.Loaded = false;
    this._name = name;

    this.schema = {
    };

    this.Create = function () {
        var ServiceTable = this._client.getTable("Service");
        var self = this;
        ServiceTable.insert({ name: this._name }).done(function (results) {
            self.schema = results[0];
            self.Loaded = true;
        });
    };

    this.Get = function () {
        var ServiceTable = this._client.getTable("Service");
        var self = this;
        ServiceTable.where(this.schema).read().done(function (results) {
            self.schema = results[0];
            self.Loaded = true;
        });
    };

    this.Load = function (newSchema, done) {
        this.schema = newSchema;
        this.Loaded = true;

        var self = this;
        this._HasBill(this.schema.id, function (num) {
            self.HasBill = (num > 0);
            $("#services").append(self.RenderTable());
            if (done) {
                if (self.HasBill) {
                    done();
                }
            }
        });
    };

    this.Remove = function () {
        var S = this._client.getTable("Service");
        var self = this;
        S.del({ id: this.schema.id });
    };

    this.HasBill = false;

    this._HasBill = function (id, callback) {
        if (this.Loaded) {
            var S = this._client.getTable("Bill");
            var self = this;
            S.where({ serviceId: id }).read().done(function (results) {
                return callback(results.length);
            });
        }
        return false;
    };

    this.RenderTable = function () {
        console.log(this.HasBill);
        return "<tr><td>" + this.schema.name + '</td><td><a href="javascript:void(0);" ' + (!this.HasBill ? 'onclick="Beta.AddBillTo(\'' + this.schema.id + '\');">Add Bill</a> | ' : '') + '<a href="javascript:void(0);" onclick="Beta.DeleteService(\'' + this.schema.id + '\');">Delete Service</a></td></tr>';
    };
}

function ServiceManager(client) {
    this._client = client;

    this.Services = new Array();

    this._readyCount = 0;

    this._ready = function () {
        this._readyCount++;

        if (this._readyCount >= this.Services.length) {
            $("#submit4").toggleClass("disabled");
            $("#submit4").get(0).innerHTML = "Almost Done";
        }
    };

    this.Load = function () {
        var Serv = this._client.getTable("Service");
        var self = this;
        this._readyCount = 0;
        Serv.read().done(function (results) {
            $("#services tbody").remove();
            for (i = 0; i < results.length; i++) {
                var f = new Service(self._client, results[i].name);
                self.Services.push(f);
                f.Load(results[i], self._ready.bind(self));
            }

            if (self.Services.length > 0) {
                $("#service-hider").toggle(true);
            }
        });
    }
}

function Bill(client, nextDue, periodStart, periodEnd, amountDue, serviceId) {

    this._client = client;

    this.schema = {
        nextDue: nextDue,
        periodStart: periodStart,
        periodEnd: periodEnd,
        amountDue: amountDue,
        serviceId: serviceId
    };

    this.Create = function () {
        var ServiceTable = this._client.getTable("Bill");
        var self = this;
        ServiceTable.insert(this.schema).done(function (results) {
            self.schema = results[0];
            self.Loaded = true;
        });
    };

    this.Get = function () {
        var ServiceTable = this._client.getTable("Bill");
        var self = this;
        ServiceTable.where({ id: this.schema.id }).read().done(function (results) {
            self.schema = results[0];
            self.Loaded = true;
        });
    };

    this.Load = function (newSchema) {
        this.schema = newSchema;
        this.Loaded = true;
    };

    this.Remove = function () {
        var S = this._client.getTable("Bill");
        var self = this;
        S.del({ id: this.schema.id });
    };

}

//Create the Paid that company class
function PTC() {

    this._currentService = new Service();
    this._ServiceManager = new ServiceManager();

    //called after a successful login
    this.loginComplete = function () {
        console.log(this._client.currentUser);
        localStorage.currentUser = JSON.stringify(this._client.currentUser);
        console.log(this.refreshAuthDisplay);
        this.refreshAuthDisplay();
    }

    this.AddBillTo = function (serviceId) {
        this._currentService = new Service(this._client);
        this._currentService.schema.id = serviceId;
        this._currentService.Get();

        UserObj.currentStep = 3;
        this.UpdateUser(true);
    };

    this.DeleteService = function (serviceId) {
        this._currentService = new Service(this._client);
        this._currentService.schema.id = serviceId;
        this._currentService.Get();

        this._currentService.Remove();
        this._currentService = new Service();
        this.UpdateUser(true);
    };

    //the client to the database
    this._client = new WindowsAzure.MobileServiceClient(
        "https://paidthatco.azure-mobile.net/",
        "NcxQUvkdSlWKazzSsFcrSjGbIhKxGG37"
    );

    //initializes the class
    this._init = function () {
        var self = this;
        $("#live-id").click(function () {
            self._client.login("microsoftaccount").then(self.loginComplete.bind(self), function (er) {
                //todo: insert an alert
            });
        });

        $("#fb").click(function () {
            self._client.login("facebook").then(self.loginComplete.bind(self), function (er) {
                //todo: insert an alert
            });
        });

        $("#twitter").click(function () {
            self._client.login("twitter").then(self.loginComplete.bind(self), function (er) {
                //todo: insert an alert
            });
        });

        $("#goog").click(function () {
            self._client.login("google").then(self.loginComplete.bind(self), function (er) {
                //todo: insert an alert
            });
        });

        this.refreshAuthDisplay();
    }

    this.loadStep = function (step) {
        switch (step) {
            case 1:
                break;
            case 2:
                //load up all the user services
                this._ServiceManager = new ServiceManager(this._client);
                this._ServiceManager.Load();
                break;
            case 3:
                $("#service-name").get(0).innerHTML = this._currentService.schema.name;
                break;
        }
    }

    //Display the current step on page load?
    this.DisplaySetupStep = function (results) {
        console.log(results);
        UserObj = results;

        this.loadStep(UserObj.currentStep);

        switch (UserObj.currentStep) {
            case 1:
            case 2:
            case 4:
            case 5:
                this.TransitionTo("loading", "step-" + UserObj.currentStep);
                break;
            case 3:
                if (!this._currentService.Loaded) {
                    UserObj.currentStep = 2;
                    this.UpdateUser(true);
                    return;
                }
                this.TransitionTo("loading", "step-3");
                break;
        }
    }

    //Transitions to another step
    this.TransitionTo = function (from, to) {
        if (from == "loading" || $("#loading").is(":visible")) {
            $("#" + from).slideUp();
        }
        else {
            $("#" + from).slideUp();
        }

        $("#" + to).slideDown();
    }

    //Initializes a user for the first time
    this.initSetupStep = function () {
        var MeTable = this._client.getTable("userInfo");
        var self = this;
        var Me = MeTable.read().then(function (results) {
            if (results.length) {
                return results[0];
            }
            else {
                return MeTable.insert(UserObj);
            }
        }).done(function (result) {
            console.log(result);
            self.DisplaySetupStep(result);
        });
    }

    //Refresh the current authentication state
    this.refreshAuthDisplay = function () {
        if (localStorage.currentUser) {
            this._client.currentUser = JSON.parse(localStorage.currentUser);
        }
        else {
            console.log("No user info saved");
        }

        var isLoggedIn = this._client.currentUser !== null;
        $("#logged-in").toggle(isLoggedIn);
        $("#logged-out").toggle(!isLoggedIn);

        if (isLoggedIn) {
            this.initSetupStep();
        }
        else {

        }
    }

    // Submits the step with validation
    this.SubmitStep = function (step) {
        switch (step) {
            case 1:
                //updates the initial user with information
                var email = $("#inputEmail").val();
                var fname = $("#inputFName").val();
                var lname = $("#inputLName").val();

                UserObj.email = email;
                UserObj.fName = fname;
                UserObj.lName = lname;
                UserObj.currentStep++;

                break;
            case 2:
                //creates a service
                this._currentService = new Service(this._client, $("#new-service").val());
                this._currentService.Create();

                $("#new-service").val("");

                break;
            case 3:
                //this creates a bill on a service
                console.log("Creating a bill");
                var b = new Bill(this._client, $("#due-on").val(), $("#period-start").val(), $("#period-end").val(), $("#bill-amount").val() * 100.0, this._currentService.schema.id);
                b.Create();
                console.log("Bill created");

                $("#due-on").val("");
                $("#period-start").val("");
                $("#period-end").val("");
                $("#bill-amount").val("");

                this._currentService = new Service();

                this.TransitionTo("step-3", "loading");

                UserObj.currentStep = 2;
                break;
            case 4:
                this.TransitionTo("step-2", "step-4");
                UserObj.currentStep = 5;
                break;
        }

        this.UpdateUser(true);

        return false;
    }

    //Updates the user to our user object
    this.UpdateUser = function (nextStep) {
        var MeTable = this._client.getTable("userInfo");
        var self = this;
        this.TransitionTo("step-" + (UserObj.currentStep - 1), "loading");
        MeTable.update(UserObj).done(function (results) {
            UserObj = results;
            self.initSetupStep();
        });
    }

    this.DoCustomCreate = function () {
        var data = {
            username: $("#userid").val(),
            password: $("#password").val(),
            login: false
        };

        var act = this._client.getTable("account");
        var self = this;
        act.insert(data).then(function (results) {
            self._saveUser(results);
        }.bind(self), function (error) {
            data.login = true;
            act.insert(data).then(function (result) {
                this._saveUser(result);
            }.bind(self), function (error) {
                console.log(error)
            });
        });
    }

    this._saveUser = function (results) {
        this._client.currentUser = {
            userId: results.user.userId,
            mobileServiceAuthenticationToken: results.token
        };

        this.loginComplete();
    }

    //calls init on itself
    this._init();
}

var Beta;

$(function () {
    Beta = new PTC();
    $(".datepicker").datepicker();
});