module.exports = {
	name: 'ready',
    once: true,
	execute(message) {
		var test = getDay(-5);
        console.log(test)
	},
};

function getDay(day){
    var today = new Date();  
    var targetday_milliseconds=today.getTime() + 1000*60*60*24*day;          
    today.setTime(targetday_milliseconds); // Note that this line is the key code
    var tYear = today.getFullYear();  
    var tMonth = today.getMonth();  
    var tDate = today.getDate();  
    tMonth = doHandleMonth(tMonth + 1);  
    tDate = doHandleMonth(tDate);  
    return tDate+"-"+tMonth+"-"+tYear;  
}
function doHandleMonth(month){
    var m = month;  
    if(month.toString().length == 1){  
       m = "0" + month;  
    }  
    return m;  
}