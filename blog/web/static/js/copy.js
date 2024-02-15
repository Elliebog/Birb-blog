$(document).ready(function () {
    $(".copybtn").click(function () {
        let content = $(this).find('.copycontent').html();
        console.log(content);
        navigator.clipboard.writeText(content);
        raiseAlert('Copied');
    });
});