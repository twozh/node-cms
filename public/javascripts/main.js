var my_prj = {

preview: function(e){
	if(!document.forms.formNewPost.checkValidity()){
		return;
	}

	e.preventDefault();
	$("#formNewPost").hide();

	$("#preTitle").html($("#tilte").val());
	$("#preContent").html(marked($("#content").val()));

	$("#preview").removeClass("hidden");

	return;
},

back: function(e){
	$("#formNewPost").show();
	$("#preview").addClass("hidden");
},

getPostFormContent: function(){
	var post = {};
	post.title = $("#title").val();
	//post.author, attach in server side
	post.category = $("input[name='category']:checked").val();
	post.content = {};
	post.content.full  = $("#content").val();
	post.url = $("#url").val();
	post.image = [];
	post.postid = $("#btnSubmit").attr("fileid");
	post.draftid = $("#btnSave").attr("fileid");
	console.log(post);
	$("#image").find("img").each(function(index, ele){
		post.image.push($(this).attr("src"));		
	});

	return post;
},

createPost: function(e){
	if(!document.forms.formNewPost.checkValidity()){
		return;
	}
	e.preventDefault();
	
	var post = my_prj.getPostFormContent();
	
	$.post("/new", post, function(data){
		console.log(data);
		if (data.status === 'err'){
			alert(data.msg);
		} else{
			location.href = '/admin';
		}
	}).fail(function(){
		alert( "Sorry, there was a problem!" );
	});
},

saveDraft: function(e){
	if(!document.forms.formNewPost.checkValidity()){
		return;
	}
	e.preventDefault();

	var draft = my_prj.getPostFormContent();

	$.post('/new/draft', draft, function(data){
		console.log(data);
		if (data.status === 'err'){
			alert(data.msg);
		} else{
			location.href = '/admin';
		}
	}).fail(function(){
		alert( "Sorry, there was a problem!" );
	});
},

delPost: function(e){
	console.log($(e.target).attr("postid"));
	$.post("/new/delPost", {postid: $(e.target).attr("postid")}, function(data){
		console.log(data);
		if (data.status === 'err'){
			alert(data.msg);
		} else{
			$(e.target).attr('disabled', 'disabled');
			$(e.target).prev().attr('disabled', 'disabled');
		}
	}).fail(function(){
		alert( "Sorry, there was a problem!" );
	});
},

fresh: function(){
	$("#preTitle").html($("#title").val());
	$("#preUrl").html($("#url").val());
	var v = $("#content").val();
	v = marked(v);
	$("#preContent").html(v);
},

deleteImg: function(e){
	$.post("/new/delete", 
		{path: $(e.target).prev().attr('src')}, 
		function(data){
			console.log(data);
			if (data.status === 'err'){
				alert(data.msg);
			} else{
				$(e.target).parent().remove();
			}
		}).fail(function(){
			alert( "Sorry, there was a problem!" );
		});
},

upload: function(e){
	e.preventDefault();
	var v = $("input[name='upload']").val();
	console.log($("input[name='upload']").val());
	if (v === ''){
		console.log("nothing");
		return;
	}

	var fd = new FormData();
	fd.append("image", $("input[name='upload']")[0].files[0]);
	$.ajax({
		url: "/new/upload",
		data: fd,
		processData: false,
		contentType: false,
		type: "POST",
		success: function(ret){
			console.log(ret);
			var domStr = "<p><img src=";
			domStr += ret.path;
			domStr += " width=48px height=48px align='bottom'>";
			domStr += "  " + ret.path + "<input type='button' value='del' class='btn btn-primary delete'>" + "</p>";

			$("#image").append($(domStr));
			$(".delete").click(my_prj.deleteImg);
		}
	});

}

};

$(document).ready(function() {
	$("#btnPreview").click(my_prj.preview);
	$("#btnPreBack").click(my_prj.back);
	$("#btnSubmit").click(my_prj.createPost);
	$('#btnSave').click(my_prj.saveDraft);

	$("#title").keyup(my_prj.fresh);
	$("#url").keyup(my_prj.fresh);
	$("#content").keyup(my_prj.fresh);

	$("#upload").click(my_prj.upload);
	$(".delete").click(my_prj.deleteImg);
	$(".delPost").click(my_prj.delPost);
});
