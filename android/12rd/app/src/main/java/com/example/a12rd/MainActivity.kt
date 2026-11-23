package com.example.a12rd

import android.os.Bundle
import android.widget.Button
import android.widget.CheckBox
import android.widget.CompoundButton
import android.widget.ImageView
import android.widget.Toast
import android.widget.ToggleButton
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat

class MainActivity : AppCompatActivity() {

//    lateinit var button: Button
//    lateinit var cbObj1: CheckBox //강아지 체크박스 객체변수
//    lateinit var cbObj2: CheckBox //고양이 체크박스 객체변수

    lateinit var tgObj: ToggleButton //전등 스위치 토글버튼 객체변수
    lateinit var bgObj: ImageView //배경 이미지뷰 객체변수
    lateinit var ivObj1: ImageView //1번 전등 이미지뷰 객체변수
    lateinit var ivObj2: ImageView //2번 전등 이미지뷰 객체변수
    lateinit var ivObj3: ImageView //3번 전등 이미지뷰 객체변수

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_main)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

//        button = findViewById(R.id.button_id)
//        cbObj1 = findViewById(R.id.checkBox1)
//        cbObj2 = findViewById(R.id.checkBox2)
//
//        var listener = CompoundButton.OnCheckedChangeListener { buttonView, isChecked ->
//            if (isChecked) {
//                //체크박스가 선택되었을 때
//                when (buttonView.id) {
//                    R.id.checkBox1 -> Toast.makeText(applicationContext,
//                        "강아지를 선택했습니다.", Toast.LENGTH_LONG).show()
//                    R.id.checkBox2 -> Toast.makeText(applicationContext,
//                        "고양이를 선택했습니다.", Toast.LENGTH_LONG).show()
//                }
//            }
//        }
//
//        //체크박스에 리스너 연결
//        cbObj1.setOnCheckedChangeListener(listener)
//        cbObj2.setOnCheckedChangeListener(listener)

        //XML의 위젯을 객체변수에 연결
        tgObj = findViewById(R.id.toggleButton)
        bgObj = findViewById(R.id.bgImage)
        ivObj1 = findViewById(R.id.light1)
        ivObj2 = findViewById(R.id.light2)
        ivObj3 = findViewById(R.id.light3)

        //토글버튼 상태가 바뀔 때 이벤트 처리
        tgObj.setOnCheckedChangeListener(CompoundButton.OnCheckedChangeListener { buttonView, isChecked ->
            if (isChecked) {
                //켜졌을 때 : 스위치 on, 밝은 배경, 불 켜진 전등
                tgObj.setBackgroundResource(R.drawable.on)
                bgObj.setImageResource(R.drawable.bg2)
                ivObj1.setImageResource(R.drawable.light21)
                ivObj2.setImageResource(R.drawable.light22)
                ivObj3.setImageResource(R.drawable.light23)
            } else {
                //꺼졌을 때 : 스위치 off, 어두운 배경, 불 꺼진 전등
                tgObj.setBackgroundResource(R.drawable.off)
                bgObj.setImageResource(R.drawable.bg1)
                ivObj1.setImageResource(R.drawable.light11)
                ivObj2.setImageResource(R.drawable.light12)
                ivObj3.setImageResource(R.drawable.light13)
            }
        })
    }
}
