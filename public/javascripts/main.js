var my_prj = {

/*
 *  form-signup submit - ajax
 */
signup: function(event){
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
},

/*
 *  form-signin submit - ajax
 */
signin: function (event){
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
				//location.href = '/u/' + data.name;
				location.href = '/new';
			}
		}).fail(function(){
			alert( "Sorry, there was a problem!" );
		});
	}
	return false;
},

preview: function(e){
	if(!document.forms.formNewPost.checkValidity()){
		return;
	}

	e.preventDefault();
	$("#formNewPost").hide();

	$("#preTitle").html($("#tilte").val());
	$("#preBrief").html($("#brief").val());
	$("#preContent").html(marked($("#content").val()));

	$("#preview").removeClass("hidden");

	return;
},

back: function(e){
	$("#formNewPost").show();
	$("#preview").addClass("hidden");
},

createPost: function(e){
	var post = {};
	post.title = $("#tilte").val();
	//post.author, attach in server side
	post.category = $("input[name='category']:checked").val();
	post.content = {};
	post.content.brief = $("#brief").val();
	post.content.full  = $("#content").val();
	post.url = $("#url").val();

	$.post("new", post, function(data){
		console.log(data);
		if (data.status === 'err'){
			alert(data.msg);
		} else{
			location.href = '/new';
		}
	}).fail(function(){
		alert( "Sorry, there was a problem!" );
	});
},

keyupTitle: function(){
	$("#preTitle").html($("#title").val());
},

keyupUrl: function(){
	$("#preUrl").html($("#url").val());
},

};

$(document).ready(function() {
	$("#form-signup").submit(my_prj.signup);
	$("#form-signin").submit(my_prj.signin);
	//$("#new-article").submit(new_article);
	//$("button[name='delete']").click(delete_article);

	$("#btnPreview").click(my_prj.preview);
	$("#btnPreBack").click(my_prj.back);
	$("#btnSubmit").click(my_prj.createPost);

	$("#title").keyup(my_prj.keyupTitle);
	$("#url").keyup(my_prj.keyupUrl);

});
