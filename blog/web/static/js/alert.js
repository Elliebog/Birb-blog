//disable alert 
$(document).ready(function() {
    $("#sillyalert").hide();
});

function raiseAlert(message) {
    //prepare alert
    $("#sillyalert").text(message);

    //show and hide alert after    
    $("#sillyalert").fadeIn(250);
    self.setTimeout(() => {
        $("#sillyalert").fadeOut(250);
    }, 5000);
}