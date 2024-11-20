function showLoginOption(value){
    hideLoginOption()
    switch(value){
        case('login'):
        // if getLoginStatus(){
        //     showProfile();
        // }
        var overlay = document.getElementById("main-overlay");
        var windowcontainer = document.getElementById("main-login");
        overlay.style.display = "block"; 
        windowcontainer.style.display = "block";
        break;

        case('register'):
        // if getLoginStatus(){
        //     showProfile();
        // }
        var overlay = document.getElementById("main-overlay");
        var windowcontainer = document.getElementById("main-register");
        overlay.style.display = "block"; 
        windowcontainer.style.display = "block";
        break;
    }
}


function hideLoginOption() {
    let overlay = document.getElementById("main-overlay");
    let windowcontainer = document.getElementById("main-login");
    let windowcontainer_2 = document.getElementById("main-register");

    overlay.style.display = "none";
    windowcontainer.style.display = "none";
    windowcontainer_2.style.display = "none";
}