
/* 메뉴바 버튼에 마우스 이벤트 적용 */
const menuButtons = document.querySelectorAll("nav .nav-item > a");

menuButtons.forEach(function (button) {

    // 마우스를 올렸을 때
    button.addEventListener("mouseover", function () {
        button.style.backgroundColor = "#a8d5a2";
        button.style.color = "#173814";
    });

    // 마우스를 뗐을 때
    button.addEventListener("mouseout", function () {
        button.style.backgroundColor = "";
        button.style.color = "";
    });

    // 메뉴 버튼을 클릭했을 때 하위 메뉴 열기/닫기
    button.addEventListener("click", function (event) {
        const dropdown = button.nextElementSibling;

        // 하위 메뉴가 있는 버튼만 처리
        if (dropdown && dropdown.classList.contains("dropdown-menu")) {
            event.preventDefault();

            // 다른 하위 메뉴는 닫기
            document.querySelectorAll(".dropdown-menu").forEach(function (menu) {
                if (menu !== dropdown) {
                    menu.classList.remove("show");
                }
            });

            // 클릭한 하위 메뉴 열기/닫기
            dropdown.classList.toggle("show");
        }
    });
});

/* 메뉴 바깥을 클릭하면 하위 메뉴 닫기 */
document.addEventListener("click", function (event) {
    if (!event.target.closest(".nav-item")) {
        document.querySelectorAll(".dropdown-menu").forEach(function (menu) {
            menu.classList.remove("show");
        });
    }
});

/* 프로필 이미지에 마우스 이벤트 적용 */
const profileImg = document.querySelector(".profile-img");

if (profileImg) {

    // 원래 이미지 저장
    const originalImage = profileImg.src;

    // 마우스를 올렸을 때
    profileImg.addEventListener("mouseover", function () {
        profileImg.src = "img/profile_hover.jpg";
    });

    // 마우스를 뗐을 때
    profileImg.addEventListener("mouseout", function () {
        profileImg.src = originalImage;
    });
}
