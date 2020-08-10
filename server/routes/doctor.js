const express = require("express");
const router =  express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Validator = require("validator");
const isEmpty = require("is-empty");
const keys = require("../config/keys");

const ValidateDoctorRegisterInput = function validateDoctorRegisterInput(data) {
  console.log(data);
    let errors = {};
    data.name = !isEmpty(data.name) ? data.name : "";
    data.email = !isEmpty(data.email) ? data.email : "";
    data.password = !isEmpty(data.password) ? data.password : "";
    data.reg_num = !isEmpty(data.reg_num) ? data.reg_num : "";
    data.address = !isEmpty(data.address) ? data.address : "";
    data.phone = !isEmpty(data.phone) ? data.phone : "";
    data.specialization = !isEmpty(data.specialization) ? data.specialization : "";
    data.password2 = !isEmpty(data.password2) ? data.password2 : "";
    data.hospital_name = !isEmpty(data.hospital_name) ? data.hospital_name : "";

    
    if (Validator.isEmpty(data.name)) {
        errors.name = "Name field is required";
    }
    if (Validator.isEmpty(data.address)) {
        errors.address = "Address field is required";
    }
    if (Validator.isEmpty(data.specialization)) {
        errors.specialization = "Specialisation field is required";
    }
    if (Validator.isEmpty(data.reg_num)) {
        errors.reg_num = "Registration Number field is required";
    }
    if (Validator.isEmpty(data.hospital_name)) {
      errors.hospital_name = "Hospital Name field is required";
    }
    if (Validator.isEmpty(data.phone)) {
        errors.phone = "Contact Number field is required";
    }
    if (Validator.isEmpty(data.email)) {
      errors.email = "Email field is required";
    } 
    else if (!Validator.isEmail(data.email)) {
      errors.email = "Email is invalid";
    }
    if (Validator.isEmpty(data.password)) {
        errors.password = "Password field is required";
      }
      if (Validator.isEmpty(data.password2)) {
        errors.password2 = "Confirm password field is required";
      }
      if (!Validator.isLength(data.password, { min: 6, max: 20 })) {
        errors.password = "Password must be at least 6 characters";
      }
      if (!Validator.equals(data.password, data.password2)) {
        errors.password2 = "Passwords must match";
      }
      return {
        errors,
        isValid: isEmpty(errors)
      };
    };

    const ValidateDoctorLoginInput = function validateDoctorLoginInput(data) {
        let errors = {};
        data.email = !isEmpty(data.email) ? data.email : "";
        data.password = !isEmpty(data.password) ? data.password : "";// Email checks
        
        if (Validator.isEmpty(data.email)) {
          errors.email = "Email field is required";
        } 
        else if (!Validator.isEmail(data.email)) {
          errors.email = "Email is invalid";
        }
      
        if (Validator.isEmpty(data.password)) {
          errors.password = "Password field is required";
        }
        return {
          errors,
          isValid: isEmpty(errors)
        };
      };
    const ValidateDoctorOTPInput = function validateDoctorOTPInput(data) {
        let errors = {};
        data.email = !isEmpty(data.email) ? data.email : "";
        data.otp = !isEmpty(data.otp) ? data.otp : "" ;// Email checks
        
        if (Validator.isEmpty(data.email)) {
          errors.email = "Email field is required";
        } 
        else if (!Validator.isEmail(data.email)) {
          errors.email = "Email is invalid";
        }
      
        if (Validator.isEmpty(data.otp)) {
          errors.otp = "otp is required";
        }
        return {
          errors,
          isValid: isEmpty(errors)
        };
      };
      const Doctor = require ("../models/Doctor");
      router.post("/verify", (req, res) => {
    
        const { errors, isValid } = ValidateDoctorOTPInput(req.body);
        if (!isValid) {
          return res.status(400).json(errors);
        }
        var update = {isVerified: true}
        Doctor.findOneAndUpdate({ email: req.body.email, otp: req.body.otp },update).then(doctor => {
          if (!doctor) {
            return res.status(400).json({ email: "Email not found  or otp is incorrect" });
          } 
          else {
            console.log("doctor verified succesfully")
            return res.status(200).json({ verify: "verfied"});
          }
        });
      });
      
    
      router.post("/register", (req, res) => {
        console.log(req.body);
        const { errors, isValid } = ValidateDoctorRegisterInput(req.body);
       // if (!isValid) {
        //  return res.status(400).json(errors);
       // }
        Doctor.findOne({ email: req.body.email }).then(doctor => {
          if (doctor) {
            return res.status(400).json({ email: "Email already exists" });
          } 
          else {
            var otp = require('random-int')(1000, 10000);
            const newDoctor = new Doctor({
              name: req.body.name,
              email: req.body.email,
              address:req.body.address,
              password: req.body.password,
              otp: otp.toString(),
              isVerified: false,
              reg_num: req.body.reg_num,
              phone: req.body.phone,
              specialization: req.body.specialization,
              hospital_name : req.body.hospital_name,
              mon: req.body.mon,
              tues: req.body.tues,
              wed: req.body.wed,
              thrus: req.body.thrus,
              fri: req.body.fri,
              sat: req.body.sat,
              sun: req.body.sun,

            });
            console.log(newDoctor);
            bcrypt.genSalt(10, (err, salt) => {
              bcrypt.hash(newDoctor.password, salt, (err, hash) => {
                if (err) throw err;
                newDoctor.password = hash;
                newDoctor
                  .save()
                  .then(doctor => res.json(doctor), require('../validations/login').otpupdate(req.body.email,otp))
                  .catch(err => console.log(err));
              });
            });
          }
        });
      });
      
      router.post("/login", (req, res) => {
        const { errors, isValid } = ValidateDoctorLoginInput(req.body);// Check validation
        
        if (!isValid) {
          return res.status(400).json(errors);
        }
        const email = req.body.email;
        const password = req.body.password;
        Doctor.findOne({ email }).then(doctor => {
    
          if (!doctor) {
            return res.status(404).json({ emailnotfound: "Email not found " });
          }
          else if(!doctor.isVerified)
          {
            return res.status(404).json({emailnotverified: "email not verified"})
          };
          bcrypt.compare(password, doctor.password).then(isMatch => {
            if (isMatch) {
              const payload = {
                id: doctor.id,
                name: doctor.name,
                reg_num: doctor.reg_num,
                doctor: true,
                patient: false,
              };
              jwt.sign(
                payload,
                keys.secretOrKey,
                {
                  expiresIn: 31556926
                },
                (err, token) => {
                  res.json({
                    success: true,
                    token: "Bearer " + token
                  });
                }
               
              );
              console.log(doctor.email);
              console.log("doctorlogin ");
            } else {
              return res.status(400).json({ passwordincorrect: "Password incorrect" });
            }
          });
        });
      });
    
    
      module.exports = router;
