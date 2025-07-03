import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, where, query, serverTimestamp, orderBy, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAUjCKERRTPH6kcmbW-cyEirSTW6SfivCQ",
  authDomain: "spartaminiproject-8c1e4.firebaseapp.com",
  projectId: "spartaminiproject-8c1e4",
  storageBucket: "spartaminiproject-8c1e4.firebasestorage.app",
  messagingSenderId: "1006694549228",
  appId: "1:1006694549228:web:c86739b1a0acdb96d547c9",
  measurementId: "G-92P7CY7JRK",
};

// Firebase 인스턴스 초기화
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

/**
 * 페이지가 로드되면 Firestore에서 팀원 정보를 가져와 슬라이더에 렌더링합니다.
 */
document.addEventListener("DOMContentLoaded", async () => {
  const members = await fetchMembers();
  const selectedName = getNameFromHomeURL();
  getMember(selectedName, members);
  renderSlider(members);
  loadMessages(selectedName);
});

/**
 * Firestore에서 팀원 정보를 가져옵니다.
 * @returns {Promise<Array>} 팀원 정보 배열
 */
async function fetchMembers() {
  const qs = await getDocs(collection(db, "member"));
  const members = [];
  qs.forEach((doc) => {
    members.push(doc.data());
  });
  return members;
}

async function getMember(selectedName, members) {
  // javascript array 고차함수인 filter를 사용하여 name과 일치하는 팀원 정보 찾기
  const member = members.filter((doc) => doc.name === selectedName)[0];
  if (!member) {
    alert("멤버를 찾을 수 없습니다.");
    return;
  }

  // HTML 요소에 값 주입
  $("#member-img").attr("src", member.img);
  $("#member-name").text(member.name);
  $("#member-mbti").text(member.mbti);
  $("#member-greeting").text(member.title);
  $("#member-skillsHobbies").text(`${member.spec} / ${member.hobby}`);
  $("#member-strengthsWeaknesses").text(`${member.pros} / ${member.cons}`);
  $("#member-likesDislikes").text(`${member.like} / ${member.hate}`);
  $("#member-titleSongInfo").text(member.song);
  $("#member-titleSongLink").html(`
      <a href="${member.songUrl}" target="_blank" rel="noopener noreferrer" class="link-primary">
        유튜브에서 보기
      </a>
    `);
  // 블로그 링크 처리
  $("#member-blogUrl-container a").attr("href", member.blog).text(member.blog);
}

/**
 * 슬라이더에 팀원 정보를 렌더링합니다.
 * @param {Array} members - 팀원 정보 배열
 */
function renderSlider(members) {
  const slider = document.getElementById("teamMemberSlider");
  slider.innerHTML = "";
  members.forEach((member) => {
    const item = document.createElement("div");
    item.className = "slider-item";
    item.innerHTML = `
        <img src="${member.img}" alt="${member.name}" class="slider-img" />
        <div class="slider-name">${member.name}</div>
        <div class="slider-role">${member.mbti}</div>
      `;

    // 클릭 이벤트 리스너 추가
    item.addEventListener("click", () => {
      getMember(member.name, members);
      loadMessages(member.name);
      history.replaceState(null, "", `?name=${encodeURIComponent(member.name)}`);
    });

    slider.appendChild(item);
  });
}

/**
 * URL에서 name 파라미터를 가져옵니다.
 * @returns {string} 이름
 */
function getNameFromHomeURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("name") || "박신희"; // 기본값 설정
}

//-----------------------------------------------------------------------------
async function loadMessages(selectedName) {
  // 메시지 입력창과 이름 입력창 초기화
  document.getElementById("guestName_i").value = "";
  document.getElementById("guestMessage_i").value = "";
  document.getElementById("wrght").removeAttribute("data-edit-id");
  document.getElementById("guestSubmit_i").textContent = "등록";
  document.getElementById("cancelEdit_i").style.display = "none";

  const messagesList = document.getElementById("messagesList");
  messagesList.innerHTML = "";

  const q = query(collection(db, "guestbook"), where("to", "==", selectedName), orderBy("createdAt", "desc"));

  const querySnapshot = await getDocs(q);
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const li = document.createElement("li");
    li.classList.add("guest-li");
    li.innerHTML = `
        <strong>${data.guestName || "익명"}</strong><br>
        <span class="msg-text">${data.guestMessage || ""}</span>
        <button class="editBtn" data-id="${doc.id}">수정</button>
        <button class="deleteBtn" data-id="${doc.id}">삭제</button>
    `;
    messagesList.appendChild(li);
  });
}

document.getElementById("wrght").addEventListener("submit", async function (e) {
  e.preventDefault();
  const guestName = document.getElementById("guestName_i").value.trim();
  const guestMessage = document.getElementById("guestMessage_i").value.trim();
  const editId = this.getAttribute("data-edit-id");

  if (guestName.length < 1) {
    alert("이름을 입력해주세요.");
    return;
  }
  if (guestMessage.length < 1) {
    alert("메시지를 입력해주세요.");
    return;
  }

  const selectedName = getNameFromHomeURL();
  if (editId) {
    await updateDoc(doc(db, "guestbook", editId), {
      guestName: guestName,
      guestMessage: guestMessage,
      to: selectedName,
    });
    this.removeAttribute("data-edit-id");
    document.getElementById("guestSubmit_i").textContent = "등록";
    document.getElementById("cancelEdit_i").style.display = "none";
  } else {
    await addDoc(collection(db, "guestbook"), {
      guestName,
      guestMessage,
      to: selectedName,
      createdAt: serverTimestamp(),
    });
  }
  document.getElementById("guestName_i").value = "";
  document.getElementById("guestMessage_i").value = "";
  document.getElementById("cancelEdit_i").style.display = "none";
  loadMessages(selectedName);
});

document
  .getElementById("messagesList")
  .addEventListener("click", async function (e) {
    if (e.target.classList.contains("editBtn")) {
      const docId = e.target.getAttribute("data-id");
      const li = e.target.closest("li");
      const name = li.querySelector("strong").innerText;
      const msg = li.querySelector(".msg-text").innerText;
      document.getElementById("guestName_i").value = name;
      document.getElementById("guestMessage_i").value = msg;
      document
        .getElementById("wrght")
        .setAttribute("data-edit-id", docId);
      document.getElementById("guestSubmit_i").textContent = "수정";
      document.getElementById("cancelEdit_i").style.display = "inline";
    } else if (e.target.classList.contains("deleteBtn")) {
      const docId = e.target.getAttribute("data-id");
      if (confirm("정말 삭제하시겠습니까?")) {
        await deleteDoc(doc(db, "guestbook", docId));
        loadMessages(getNameFromHomeURL());
      }
    }
  });
document.getElementById("cancelEdit_i").addEventListener("click", function () {
  document.getElementById("guestName_i").value = "";
  document.getElementById("guestMessage_i").value = "";
  document.getElementById("wrght").removeAttribute("data-edit-id");
  document.getElementById("guestSubmit_i").textContent = "등록";
  this.style.display = "none";
});