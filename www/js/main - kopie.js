$.ajax({
    url: 'xml/paul.xml',
	async : false,
	dataType: (navigator.appVersion.indexOf("MSIE") !== -1) ? "text" : "xml",
	success : function(response) {
		if (typeof response == "string") 
		{
			$xml = new ActiveXObject("Microsoft.XMLDOM");
			$xml.async = false;
			$xml.loadXML(response);
		} 
		else 
			$xml = $(response);
		},
	error: function(XMLHttpRequest, textStatus, errorThrown) 
		{
		alert('Data Could Not Be Loaded - '+ textStatus);
	}
});

//var  data = $.parseXML($xml);

var characters = $xml.find('character');
	cha_name = characters[0].getElementsByTagName('name');

$(function(){
	$('#name').append(cha_name);
})	


