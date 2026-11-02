package com.example.a9rd

import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat

class MainActivity : AppCompatActivity() {
    // 1. 버튼 객체 변수 선언
    lateinit var button: Button
    lateinit var textView3: TextView

    // 지금 결과가 보이고 있는지 기억하는 변수
    var isCalculated = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_main)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        // 2. 변수에 위젯 id 가져오기
        button = findViewById(R.id.button_id)
        textView3 = findViewById(R.id.textView3)
    }

    // 3. XML의 android:onClick="onButtonClick" 으로 호출되는 이벤트 처리 메서드
    fun onButtonClick(view : View?){
        if (isCalculated) {
            // 결과가 보이는 상태 → 원래대로 되돌리기
            textView3.text = "200+300"
            button.text = "계산하기"
        } else {
            // 처음 상태 → 계산 결과 보여주기
            val result = 200 + 300
            textView3.text = "200 + 300 = $result"
            button.text = "되돌리기"
        }
        isCalculated = !isCalculated

        Toast.makeText(applicationContext, "버튼을 눌렀습니다",
            Toast.LENGTH_SHORT).show()
    }
}
