const CopyIcon = "<i class=\"bi bi-copy\"></i>"
const CopyCheckmarkIcon = "<i class=\"bi bi-check\"></i>"

function CopyBtn(btnId) {
    //change the icon
    document.getElementById(btnId).innerHTML = CopyCheckmarkIcon;
    //copy to clipboard
    
}