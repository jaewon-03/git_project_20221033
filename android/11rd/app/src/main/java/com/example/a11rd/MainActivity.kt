package com.example.a11rd

import android.graphics.Color
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.ImageButton
import android.widget.ImageView
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat

class MainActivity : AppCompatActivity() {

//    lateinit var button: Button
//    lateinit var imageView: ImageView
//    lateinit var imageView2: ImageView
//    var isClicked = false

    lateinit var btObj1: ImageButton //1번 껍데기 버튼 객체변수
    lateinit var btObj2: ImageButton //2번 껍데기 버튼 객체변수 (정답)
    lateinit var btObj3: ImageButton //3번 껍데기 버튼 객체변수
    lateinit var btObj4: ImageButton //4번 껍데기 버튼 객체변수
    lateinit var ivObj: ImageView //달팽이 위에 껍데기를 보여줄 이미지뷰 객체변수



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
//        imageView = findViewById(R.id.imageView)
//        imageView2 = findViewById(R.id.imageView2)

        btObj1 = findViewById(R.id.button1)
        btObj2 = findViewById(R.id.button2)
        btObj3 = findViewById(R.id.button3)
        btObj4 = findViewById(R.id.button4)

        ivObj = findViewById(R.id.imageView2)

        //첫 번째 버튼 클릭 시 이벤트 처리
        btObj1.setOnClickListener(View.OnClickListener {
            ivObj.setVisibility(View.VISIBLE)           //이미지 뷰가 보이도록 설정
            ivObj.setImageResource(R.drawable.answer1)  //이미지 리소스 변경
            Toast.makeText(getApplicationContext(), "틀렸습니다", Toast.LENGTH_SHORT).show()
        })
        //두 번째 버튼 클릭 시 이벤트 처리
        btObj2.setOnClickListener(View.OnClickListener {
            ivObj.setVisibility(View.VISIBLE)           //이미지 뷰가 보이도록 설정
            ivObj.setImageResource(R.drawable.answer2)  //이미지 리소스 변경
            Toast.makeText(getApplicationContext(), "맞았습니다", Toast.LENGTH_SHORT).show()
        })
        //세 번째 버튼 클릭 시 이벤트 처리
        btObj3.setOnClickListener(View.OnClickListener {
            ivObj.setVisibility(View.VISIBLE)           //이미지 뷰가 보이도록 설정
            ivObj.setImageResource(R.drawable.answer3)  //이미지 리소스 변경
            Toast.makeText(getApplicationContext(), "틀렸습니다", Toast.LENGTH_SHORT).show()
        })
        //네 번째 버튼 클릭 시 이벤트 처리
        btObj4.setOnClickListener(View.OnClickListener {
            ivObj.setVisibility(View.VISIBLE)           //이미지 뷰가 보이도록 설정
            ivObj.setImageResource(R.drawable.answer4)  //이미지 리소스 변경
            Toast.makeText(getApplicationContext(), "틀렸습니다", Toast.LENGTH_SHORT).show()
        })
    }

//    fun onButtonClick(view : View?){
//        if (isClicked) {
//            button.text = "버튼"
//            button.setBackgroundColor(Color.RED)
//            imageView.setImageResource(0)
//            imageView2.setImageResource(0)
//        } else {
//            button.text = "버튼 클릭 이벤트"
//            button.setBackgroundColor(Color.BLUE)
//            imageView.setImageResource(R.drawable.cat1)
//            imageView2.setImageResource(R.drawable.cat2)
//        }
//        isClicked = !isClicked
//    }
}