const { message } = require("antd");

exports.checkResponseApi = (responseApi, navigate) =>{
    if(responseApi.status === 401 || responseApi.status === 403){
        message.warning("Invalid or expired token");   
        navigate("/login-moph");
    } else {
        let responseMessage = responseApi.message == null ? responseApi : responseApi.message;
        try {
            responseMessage = responseApi.data.message 
        } catch (error) {
            
        }
        message.warning(responseMessage);   
    }
}

