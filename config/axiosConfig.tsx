import axios from 'axios';

const axiosBasicInstance = axios.create({
  baseURL: "http://ec2-15-206-169-129.ap-south-1.compute.amazonaws.com:5000",
});

export default axiosBasicInstance;