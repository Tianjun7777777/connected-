
// wikipedia API example code from https://codesnippet.io/wikipedia-api-tutorial/
// no longer used
function addElementsToScene(scene) {
  var query = document.getElementById("searchTextValue").value;
  console.log("addwikeEle..");
  var xhr = new XMLHttpRequest();
  var url = `https://en.wikipedia.org/w/api.php?action=query&origin=*&format=json&generator=search&gsrnamespace=0&gsrlimit=35&gsrsearch='${query}'`;


  xhr.open("GET", url, true);

  xhr.onload = function () {
    var data = JSON.parse(this.response);

    // console.log(data);

    console.log(data.query.pages);

    for (var i in data.query.pages) {
      let title = data.query.pages[i].title.replace(/[\s]/g, "_"); // Replace whitespaces with underscores
      console.log(title);
      let link = "https://en.wikipedia.org/wiki/" + title;
      addLinkElement(scene, link);
    }
  };

  // Send request to the server
  xhr.send();
}


function addLinkElement(scene, link){

    let linkGeometry = new THREE.SphereGeometry(1,12,12);
    let linkMaterial = new THREE.MeshPhongMaterial({color: 'grey'});
    let linkMesh = new THREE.Mesh(linkGeometry, linkMaterial);

    linkMesh.userData.interactable = true;
    linkMesh.userData.link = link;
    // console.log('link:',link);

    scene.add(linkMesh);
    linkMesh.position.set(10,10,10);
}


function addURLLinkElement(scene){
  let link = 'https://www.tiaanjun.com/';
  let texture = new THREE.TextureLoader().load("../assets/textureMoon.png");
  let linkGeometry = new THREE.SphereGeometry(1,12,12);
  let linkMaterial = new THREE.MeshPhongMaterial({ map: texture });
  let linkMesh = new THREE.Mesh(linkGeometry, linkMaterial);

  linkMesh.userData.interactable = true;
  linkMesh.userData.link = link;
  linkMesh.userData.nolongerAdd = true;
  // console.log('link:',link);

  scene.add(linkMesh);
  linkMesh.position.set(20,10,20);
}