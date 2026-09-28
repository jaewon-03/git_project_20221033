package com.example.a2th

import org.junit.Test

import org.junit.Assert.*
import android.util.Log

/**
 * Example local unit test, which will execute on the development machine (host).
 *
 * See [testing documentation](http://d.android.com/tools/testing).
 */
class ExampleUnitTest {
    @Test
    fun addition_isCorrect() {
        assertEquals(4, 2 + 2)

        val myAge = 24
        // myAge = 25

        val myName = "이재원"   // String형 추론
        val age: Int = 24      // 명시적 Int형 지정
        //myName = "이재원"       // 오류: val 변수는 값을 변경할 수 없음
        println("코틀린: 불변 변수 val 나의 이름은 " + myName)

        println("나이 : $myAge")
        println("진짜나이 : " + myAge)

        var numOne = 1   //Int형 추론
        var numTwo = 3000000000   //Long형 추론
        var myByte: Byte = 1   //명시적 Byte형 추론
        var myInt: Int = 20   //명시적 Int형 추론
        var myLong = 25L      //명시적 Long형 지정

        println("코틀린 : 정수 자료형")
        println("Int : $numOne")
        println("Long : $numTwo")
        println("Byte : $myByte")
        println("Int : $myInt")
        println("Long : $myLong")

        var myFloat = 30.2F   //Float형 추론
        var myDouble = 35.4   //Double형 추론

        println("코틀린 : 실수 자료형")
        println("Float : " + myFloat)
        println("Double : " + myDouble)

        var myBoolean: Boolean = true  //명시적 boolean형 지정
        println("코틀린 : 부울린 자료형")
        println("Boolean : " + myBoolean)

        var myChar1: Char = 'K' //변수 myChar1에 문자 값 'K'를 저장
        var myChar2: Char = 'o' //변수 myChar1에 문자 값 'o'를 저장
        var myChar3: Char = 't' //변수 myChar1에 문자 값 't'를 저장
        var myChar4: Char = 'l' //변수 myChar1에 문자 값 'l'을 저장
        var myChar5: Char = 'i' //변수 myChar1에 문자 값 'i'를 저장
        var myChar6: Char = 'n' //변수 myChar1에 문자 값 'n'를 저장
        println("코틀린 : 문자 자료형")
        println("Char : " + myChar1 + myChar2 + myChar3 + myChar4 + myChar5 + myChar6)

        var myString1: String = "Kotlin\n"
        var myString2: String = "Java"
        println("코틀린 : 문자열 자료형 ")
        println("Stiring : " + myString1)
        println("Stiring : " + myString2)

        var myArray: IntArray = intArrayOf(1, 2, 3, 4, 5) //배열 myArray에 1,2,3,4,5, 저장
        println("코틀린 : 배열 자료형 ")
        println("배열의 3번째 값 : " + myArray[2])

        var myX: Int = 100
        // var myY: Long = myX.toLong()   // Int → Long 변환
        var myY: Float = myX.toFloat()    // Int → Float 변환
        println("코틀린 : 자료형 변환")
        println("Int : $myX")
        println("Float : $myY")

        var x: Int = 4
        var y: Int = 2
        println("코틀린 : 산술 연산자")
        println("덧셈 x + y = " + (x + y))
        println("뺄셈 x - y = " + (x - y))
        println("나눗셈 x / y = " + (x / y))
        println("곱셈 x * y = " + (x * y))
        println("나머지 x % y = " + (x % y))

        println("크다 x > y = " + (x > y))
        println("작다 x < y = " + (x < y))
        println("크거나 같다 x >= y = " + (x >= y))
        println("작거나 같다 x <= y = " + (x <= y))
        println("같다 x == y = " + (x == y))
        println("같지 않다 x != y = " + (x != y))

        y -= x
        println("코틀린 : 할당 연산자")
        println("y -= x => y = " + y)

        y *= x
        println("y *= x => y = " + y)

        y /= x
        println("y /= x => y = " + y)

        y %= x
        println("y %= x => y = " + y)


        // var x: Int = 1

        println("코틀린 : 증감 연산자")
        println("++x = " + (++x))

        println("--x = " + (--x))

        var num: Int = 10
        if (num % 2 == 0) {
            println("코틀린 : if-else 조건문 " + "숫자 " + num + "은 짝수")
        } else {
            println("코틀린 : if-else 조건문 " + "숫자 " + num + "은 홀수")
        }

        num = -10
        var result: String

        if (num > 0) {
            result = "숫자 " + num + "은 양수"
        } else if (num == 0) {
            result = "숫자 " + num + "은 0"
        } else {
            result = "숫자 " + num + "은 음수"
        }
        println("코틀린 : if-else if 조건문 " + result)

        num = -10

        if (num > 0) {
            if (num % 2 == 0) {
                result = "숫자 " + num + "은 양수이고 짝수"
            } else {
                result = "숫자 " + num + "은 양수이고 홀수"
            }
        } else {
            if (num % 2 == 0) {
                result = "숫자 " + num + "은 음수이고 짝수"
            } else {
                result = "숫자 " + num + "은 음수이고 홀수"
            }
        }
        println("코틀린 : 중첩 if 조건문 " + result)

        var day: Int = 2

        when (day) {
            1 -> result = "Monday"
            2 -> result = "Tuesday"
            3 -> result = "Wednesday"
            4 -> result = "Thursday"
            5 -> result = "Friday"
            6 -> result = "Saturday"
            7 -> result = "Sunday"
            else -> result = "Invalid day"
        }
        println("코틀린 : when 조건문 " + result)

        for (i in 5 downTo 1 step 2) {
            println("코틀린 : for 반복문 " + "반복 변수 : " + i)
        }

        var numbers = arrayOf(1, 2, 3, 4, 5)
        for (i in numbers) {    //i in [1, 2, 3, 4, 5]와 같은 의미
            if (i % 2 == 1) {
                println("코틀린 : for 반복문 " + "반복 변수 : " + i)
            }
        }

        var score: Int = 95
        var attendanceRate: Int = 90

        if (attendanceRate < 80) {
            result = "F(낙제)"
            println(result)
        } else {
            if (score >= 90) {
                result = "A 학점"
                println(result)

                if (score >= 95) {
                    println("A+ 장학생 선발 대상")
                }
            } else if (score >= 80) {
                result = "B 학점"
                println(result)
            } else if (score >= 70) {
                result = "C 학점"
                println(result)
            } else {
                result = "F 학점"
                println(result)
            }
        }

        println("코틀린 : 구구단")

        // 기존 구구단 코드
        // for (i in 1..9) {
        // var i: Int = 10
        //     for (j in 2..9) { // 2단부터 9단까지만 먼저 가로로 출력
        //         print("$j x $i = ${j * i}\t")
        //
        //       println() // 줄바꿈
        // }

        // for (i in 1..9) {
        for (i in 10..13) {
            for (j in 5..10) { // 10단부터 13단까지 가로로 출력
                print("$i x $j = ${i * j}\t")
            }

            println() // 줄바꿈
        }
    }
}