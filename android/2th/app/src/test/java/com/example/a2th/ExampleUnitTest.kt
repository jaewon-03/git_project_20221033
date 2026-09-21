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

        val myAge =24
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

        var myBoolean : Boolean = true  //명시적 boolean형 지정
        println("코틀린 : 부울린 자료형")
        println("Boolean : " + myBoolean)

        var myChar1 : Char = 'K' //변수 myChar1에 문자 값 'K'를 저장
        var myChar2 : Char = 'o' //변수 myChar1에 문자 값 'o'를 저장
        var myChar3 : Char = 't' //변수 myChar1에 문자 값 't'를 저장
        var myChar4 : Char = 'l' //변수 myChar1에 문자 값 'l'를 저장
        var myChar5 : Char = 'i' //변수 myChar1에 문자 값 'i'를 저장
        var myChar6 : Char = 'n' //변수 myChar1에 문자 값 'n'를 저장
        println("코틀린 : 문자 자료형")
        println("Char : " +myChar1+myChar2+myChar3+myChar4+myChar5+myChar6)

        var myString1 : String = "Kotlin\n"
        var myString2 : String = "Java"
        println("코틀린 : 문자열 자료형 ")
        println("Stiring : " +myString1)
        println("Stiring : " +myString2)

        var myArray: IntArray = intArrayOf(1,2,3,4,5) //배열 myArray에 1,2,3,4,5, 저장
        println("코틀린 : 배열 자료형 ")
        println("배열의 3번째 값 : " + myArray[2])

    }
}