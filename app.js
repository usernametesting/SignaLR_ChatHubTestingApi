// ------------------------ V-Models ------------------------

//global variables
var toUserId = 0;

// requet vm
function reqParams(controller, action, queryString, token, method) {
    this.controller = controller;
    this.action = action;
    this.queryString = queryString;
    this.token = token;
    this.method = method;
}
const Method = {
    POST: 'POST',
    GET: 'GET',
    PUT: 'PUT',
    DELETE: 'DELETE'
};
// login-user v_model
function loginUserVM(email, password) {
    this.email = email;
    this.password = password;
}
// register-user v_model
function registerUserVM(name, surname, email, password) {
    this.name = name;
    this.surname = surname;
    this.email = email;
    this.password = password;
}

// ------------------------ Services ------------------------
// request sender service
function request(data, reqParams, successCallBack, errorCallBack) {
    let url = generateUrl(reqParams);
    console.log(url);
    $.ajax({
        type: reqParams.method,
        url: url,
        data: JSON.stringify(data),
        dataType: "json",
        contentType: "application/json",
        headers: {
            'Authorization': 'Bearer ' + reqParams.token
        },
        success: (response) => {
            successCallBack(response);
        },
        error: (error) => {

            errorCallBack(error.responseText);
        }
    });
}
// url generator service
function generateUrl(reqParams) {
    return "https://localhost:7192/api" +
        (reqParams.controller !== null ? `/${reqParams.controller}` : "") +
        (reqParams.action !== null ? `/${reqParams.action}` : "") +
        (reqParams.queryString !== null ? `?${reqParams.queryString}` : "") +
        (reqParams.token !== null ? (reqParams.queryString !== null ? "&" : "?") + `token=${reqParams.token}` : "");
}




// ----------------------------------------------login page ----------------------------------------------

$('.input').each(function () {
    $(this).on('focus', function () {
        $(this).prev().addClass('input-content-hidden');
    });

    $(this).on('blur', function () {
        $(this).val() === "" ? $(this).prev().removeClass('input-content-hidden') : "";
    });
});


// click register link
$(document).ready(() => {
    $('#register')?.on('click', () => {
        location.href = './register.html';
    });
});


//validation login informations
function loginValidator(email, pass) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_])[A-Za-z\d@$!%*?&_]{8,}$/;
    // return passwordRegex.test(pass) && emailRegex.test(email);
    return true;
}



// ----------------------------------------------register page ----------------------------------------------
// click login link
$(document).ready(() => {

    $('#login')?.on('click', () => {
        location.href = './index.html';
    });
});

// registration
$(document).ready(() => {
    $('#register-btn').on('click', () => {
        // register();
        let user = new registerUserVM(
            $('#register-name').val(),
            $('#register-surname').val(),
            $('#register-email').val(),
            $('#register-password').val());

        let req_params = new reqParams('Auth', 'register', null, null, Method.POST);

        request(user, req_params,
            (resp) => {
                alertify.success("user registered successdfully");
                setTimeout(() => {
                    location.href = './index.html';
                }, 800);
            },
            (error) => {
                alertify.error(error);
            });
    });
});


// login
$(document).ready(() => {

    $('#login-btn').on('click', () => {
        let email = $('#login-email').val();
        let pass = $('#login-password').val();

        if (!loginValidator(email, pass)) {
            alertify.error("invalid data");
            return;
        }

        let user = new loginUserVM(
            $('#login-email').val(),
            $('#login-password').val());

        let req_params = new reqParams('Auth', 'login', null, null, Method.POST);

        request(user, req_params,
            (resp) => {
                setCookie('token', resp.authToken);
                setCookie('userId', resp.id);
                alertify.success(resp.msg);
                location.href = `chat.html?id=${resp.id}`;
            },
            (error) => {
                console.log("errir");
                error === undefined ? alertify.error("server is not responfing") : alertify.error(error);
            });
    });

});



document.addEventListener('DOMContentLoaded', async () => {
    const currentPage = window.location.pathname;
    console.log("currentPage" + currentPage);
    // products page loading
    if (currentPage.includes('chat.html')) {
        const id = (new URLSearchParams(window.location.search)).get('id');
        console.log("result: " + id);

        const headers = new Headers();
        headers.append("Authorization", `Bearer ${getCookie('token')}`);
        const connection = new signalR.HubConnectionBuilder()
            .withUrl(`https://localhost:7192/chatHub?userId=${id}`, {
                accessTokenFactory: () => getCookie('token')
            })
            .build();

        connection.on("UserConnected", async (user) => {
            addUser(user);
        });

        connection.on("UserDisconnected", async (connectionId) => {
            $(`#active-users-list li[data-connection-id=${connectionId}]`).remove();
            console.log("deleted");
        });

        connection.on("ReceiveMessage", (user, message) => {
            messageTransation(message, 'left');
        });

        connection.start().then(async () => {
            $('#active-users-list').empty();
            try {
                const activeUsers = await connection.invoke("GetActiveUsers");
                activeUsers.forEach((user) => {
                    addUser(user);
                });
            } catch (err) {
                console.error(err.toString());
            }
        }).catch(err => console.error(err.toString()));


        $('#sendButton').on('click', (e) => {

            const message = $('#message-input').val();

            connection.invoke("SendMessage", toUserId, message).catch(err => console.error(err.toString()));

            messageTransation(message, 'right');

            e.preventDefault();
        });


    }
});

// ----------------------- cookie operations -----------------------
// set cookie
function setCookie(key, value) {
    document.cookie = encodeURIComponent(key) + "=" + encodeURIComponent(value) + ";path=/";
}

//get cookie
function getCookie(key) {
    var name = key + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var cookieArray = decodedCookie.split(';');
    for (var i = 0; i < cookieArray.length; i++) {
        var cookie = cookieArray[i];
        while (cookie.charAt(0) == ' ') {
            cookie = cookie.substring(1);
        }
        if (cookie.indexOf(name) == 0) {
            return cookie.substring(name.length, cookie.length);
        }
    }
    return "";
}


var imgSrc = "data:image/png;base64,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";
function addUser(user) {
    var li = document.createElement("li");

    var img = document.createElement("img");
    img.src = imgSrc;

    var span = document.createElement("span");
    span.textContent = user.userName;

    li.id = user.userId;
    // li.attr('data-connection-id', user.connectionId);
    li.setAttribute('data-connection-id', user.connectionId);
    li.appendChild(img);
    li.appendChild(span);

    li.addEventListener('click', () => {
        userSelected(user.userId);
    });

    $('#active-users-list').append(li);
}


function userSelected(userId) {

    $('#active-users-list li').css('background-color', 'lightyellow');
    $(`#${userId}`).css('background-color', 'lightsteelblue');

    toUserId = userId;
}

function messageTransation(message, position) {
    const msg = `${message}`;
    const li = document.createElement("li");
    li.textContent = msg;
    li.style.textAlign = position;
    document.getElementById("messages-list").appendChild(li);
}

