package com.example.a10rd

import android.os.Bundle
import android.view.View
import android.widget.EditText
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat

class MainActivity : AppCompatActivity() {

//    lateinit var nameObj : EditText //성명객체변수
//    lateinit var passwordObj : EditText //비밀번호 객체변수
//    lateinit var emailObj : EditText //이메일 객체변수
//    lateinit var dateObj : EditText //생년월일 객체변수
//    lateinit var phoneObj : EditText //연락처 객체변수
//    lateinit var resultObj : TextView //결과보기 객체변수

    lateinit var imageObj : ImageView //이미지뷰 객체변수
    var cats = arrayOf(R.drawable.cat1, R.drawable.cat2, R.drawable.cat3) //고양이 사진
    var index = 0 //지금 보이는 사진 번호

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_main)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }
//        nameObj = findViewById(R.id.editName)
//        passwordObj = findViewById(R.id.editPassword)
//        emailObj = findViewById(R.id.editEmail)
//        dateObj = findViewById(R.id.editDate)
//        phoneObj = findViewById(R.id.editPhone)
//        resultObj = findViewById(R.id.tvResult)
        imageObj = findViewById(R.id.imageView)
    }

//    fun onButtonClick(view:View?) {
//        if (nameObj.text.toString().isEmpty() || passwordObj.text.toString().isEmpty() ||
//            emailObj.text.toString().isEmpty() || dateObj.text.toString().isEmpty() ||
//            phoneObj.text.toString().isEmpty()) {
//            Toast.makeText(applicationContext, "모든 항목을 입력하세요", Toast.LENGTH_SHORT).show()
//        } else {
//            resultObj.setText("성명 - ${nameObj.text} \n" +
//                    "비밀번호 - ${passwordObj.text} \n" +
//                    "이메일 - ${emailObj.text} \n" +
//                    "생년월일 - ${dateObj.text} \n" +
//                    "연락처 - ${phoneObj.text}")
//        }
//    }

    fun onPrevClick(view:View?) {
        index = (index + 2) % 3
        imageObj.setImageResource(cats[index])
    }

    fun onNextClick(view:View?) {
        index = (index + 1) % 3
        imageObj.setImageResource(cats[index])
    }
}
