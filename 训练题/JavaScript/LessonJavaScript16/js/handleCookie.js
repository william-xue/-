/* handleCookie */
// 添加cookie k:cookie的key, v:cookie的value, t:cookie生命周期 
function addCookie(k, v, t){
	/*
	  t的数据类型如果是object或者string, 则使用expires的写法
	  t的数据类型时number, 则使用max-age的写法
	  如果没有填第3个参数, 默认生命周期
	*/
    if(typeof t == "object" || typeof t == "string"){
		document.cookie = `${k}=${v};expires=${t.toString()}`;
	}else if(typeof t == "number"){
		document.cookie = `${k}=${v};max-age=${t}`;
	}else {
		document.cookie = `${k}=${v}`;
	}
}

// 获取cookie值
function getCookieByKey(k){
	var kvArr = document.cookie.split("; ");
	for (var i = 0; i < kvArr.length; i++) {
		var kvArr1 = kvArr[i].split("=");
		if(kvArr1[0] == k){
			if(kvArr1.length > 2) {
				kvArr1.shift();
				return kvArr1.join("=");
			}else {
				return kvArr1[1];
			}
		}
	}
	return "";
}
// 修改cookie
function updateCookie(k, v, t){
	if(getCookieByKey(k)) {
		addCookie(k, v, t);
	}
}
// 删除cookie
function deleteCookie(k){
	document.cookie = `${k}=;max-age=-1`;
}
