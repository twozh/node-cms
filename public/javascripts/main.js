/*
 *  form-signup submit - ajax
 */
function signup(event){
	if ($('#iPass').val().length < 3 || $('#iPass').val() != $('#iPass2').val()){
		$('.pass').addClass('red');
	}
	else{
		$('.pass').removeClass('red');
		var data = {
			name: $('#iName').val(),
			email: $('#iEmail').val(),
			pass: $('#iPass').val()
		};
		$.post("signup", data, function(data){
			console.log(data);
			$( "#msg" ).html(data.msg);
			if (data.status === 'err'){
				$( "#msg" ).addClass('red');
			} else{
				location.href = '/signin';
			}
		}).fail(function(){
			alert( "Sorry, there was a problem!" );
		});
	}
	return false;
}

/*
 *  form-signin submit - ajax
 */
function signin(event){
	if ($('#iPass').val().length < 3){
		$('#lPass').addClass('red');
		$( "#msg" ).html("Password's length should longer than 3");
	}
	else{
		$('#lPass').removeClass('red');

		var data = {
			name: $('#iName').val(),
			pass: $('#iPass').val()
		};
		$.post("signin", data, function(ret){
			console.log(ret);
			$( "#msg" ).html(ret.msg);
			if (ret.status === 'err'){
				$( "#msg" ).addClass('red');
			} else {
				location.href = '/u/' + data.name;
			}
		}).fail(function(){
			alert( "Sorry, there was a problem!" );
		});
	}
	return false;
}


/*
 *  new article submit - ajax
 */
function new_article(event){
	var data = {
		title: $('#i_title').val(),
		content: $('#i_content').val(),
		category: $("input[name='category']:checked").val(),
	};

	$.post("new", data, function(data){
		//console.log(data);
		$( "#msg" ).html(data.msg);
		if (data.status === 'err'){
			$( "#msg" ).addClass('red');
		} else{
			location.href = '/u/' + data.name;
		}
	}).fail(function(){
		alert( "Sorry, there was a problem!" );
	});

	return false;
}

/* delete article */
var delete_article = function(event){
	var elem = $( this );
	console.log(elem.attr('fileid'));
	$.ajax({
		url: '/fileid/' + elem.attr('fileid'),
		type: "DELETE",
		success: function( ret ) {
			console.log(ret);
			if (ret.status === "succ"){
				elem.attr('disabled', 'disabled');
			}
		},
		error: function(xhr, status, errorThrown ) {
			alert( "Sorry, there was a problem!" );
			console.log( "Error: " + errorThrown );
			console.log( "Status: " + status );
			console.dir( xhr );
		},
	});
};

$(document).ready(function() {
	$("#form-signup").submit(signup);
	$("#form-signin").submit(signin);
	$("#new-article").submit(new_article);
	$("button[name='delete']").click(delete_article);
});
