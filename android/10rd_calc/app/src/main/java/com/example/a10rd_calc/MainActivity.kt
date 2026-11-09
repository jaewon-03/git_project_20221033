package com.example.a10rd_calc

import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.TextView
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat

class MainActivity : AppCompatActivity() {

    lateinit var screenObj : TextView //계산기 화면 객체변수
    var num1 = 0 //첫번째 숫자 변수
    var op = "" //연산자(+ - * /) 변수

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_main)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }
        screenObj = findViewById(R.id.tvScreen) //계산기 화면 id 가져오기
    }

    //숫자 버튼(0~9) 클릭
    fun onNumberClick(view:View?) {
        screenObj.append((view as Button).text) //누른 숫자를 화면에 붙이기
    }

    //연산자 버튼(+ - * /) 클릭
    fun onOperatorClick(view:View?) {
        if (screenObj.text.isEmpty()) return //숫자 없으면 무시
        num1 = screenObj.text.toString().toInt() //첫번째 숫자 저장
        op = (view as Button).text.toString() //누른 연산자 저장
        screenObj.setText("") //두번째 숫자 입력 위해 화면 비우기
    }

    //= 버튼 클릭
    fun onEqualClick(view:View?) {
        if (screenObj.text.isEmpty()) return //숫자 없으면 무시
        var num2 = screenObj.text.toString().toInt() //두번째 숫자 변수
        if (op == "+") screenObj.setText("${num1 + num2}")
        else if (op == "-") screenObj.setText("${num1 - num2}")
        else if (op == "*") screenObj.setText("${num1 * num2}")
        else if (op == "/" && num2 != 0) screenObj.setText("${num1 / num2}") //0으로 나누기 방지
    }

    //C 버튼 클릭 (초기화)
    fun onClearClick(view:View?) {
        screenObj.setText("") //화면 비우기
        op = "" //연산자 비우기
    }
}
