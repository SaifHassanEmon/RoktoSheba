// Bangladesh Administrative Divisions, Districts, and Areas/Sub-districts
// Exposes complete mapping for division ➔ district ➔ area selection

export const BANGLADESH_DATA = {
  'Barishal': {
    districts: {
      'Barishal': ['Barishal Sadar', 'Rupatali', 'Nathullabad', 'Gournadi', 'Banaripara', 'Bakerganj', 'Muladi', 'Babuganj', 'Wazirpur', 'Mehendiganj'],
      'Barguna': ['Barguna Sadar', 'Amtali', 'Patharghata', 'Bamna', 'Betagi', 'Taltali'],
      'Bhola': ['Bhola Sadar', 'Char Fasson', 'Lalmohan', 'Borhanuddin', 'Daulatkhan', 'Tazumuddin', 'Manpura'],
      'Jhalokati': ['Jhalokati Sadar', 'Kathalia', 'Nalchity', 'Rajapur'],
      'Patuakhali': ['Patuakhali Sadar', 'Galachipa', 'Bauphal', 'Kalapara', 'Kuakata', 'Dashmina', 'Mirzaganj', 'Dumki'],
      'Pirojpur': ['Pirojpur Sadar', 'Bhandaria', 'Mathbaria', 'Kawkhali', 'Nazirpur', 'Nesarabad (Swarupkati)', 'Indurkani']
    }
  },
  'Chattogram': {
    districts: {
      'Chattogram': ['Halishahar', 'Panchlaish', 'Agrabad', 'Nasirabad', 'GEC', 'Patenga', 'Chawkbazar', 'Double Mooring', 'Kotwali', 'Chandgaon', 'Hathazari', 'Sitakunda', 'Mirsharai', 'Patiya', 'Boalkhali', 'Anwara', 'Lohagara', 'Rangunia'],
      'Cox\'s Bazar': ['Cox\'s Bazar Sadar', 'Kolatoli', 'Teknaf', 'Ukhiya', 'Ramu', 'Chokoria', 'Pekua', 'Kutubdia', 'Maheshkhali'],
      'Cumilla': ['Kandirpar', 'Mainamati', 'Kotbari', 'Chaudagram', 'Cumilla Sadar', 'Laksam', 'Daudkandi', 'Barura', 'Burichang', 'Chandina', 'Debidwar', 'Homna', 'Muradnagar', 'Nangalkot', 'Titas'],
      'Feni': ['Feni Sadar', 'Daganbhuiyan', 'Chhagalnaiya', 'Parshuram', 'Fulgazi', 'Sonavazi'],
      'Noakhali': ['Maijdee', 'Begumganj', 'Senbagh', 'Companiganj', 'Chatkhil', 'Hatiya', 'Subarnachar', 'Kabirhat', 'Sonaimuri'],
      'Rangamati': ['Rangamati Sadar', 'Kaptai', 'Baghaichhari', 'Barkal', 'Kawkhali', 'Langadu', 'Naniarchar', 'Rajasthali', 'Belaichhari', 'Juraichhari'],
      'Bandarban': ['Bandarban Sadar', 'Alikadam', 'Lama', 'Naikhongchhari', 'Rowangchhari', 'Ruma', 'Thanchi'],
      'Khagrachhari': ['Khagrachhari Sadar', 'Dighinala', 'Lakshmichhari', 'Mahalchhari', 'Manikchhari', 'Matiranga', 'Panchhari', 'Ramgarh'],
      'Chandpur': ['Chandpur Sadar', 'Hajiganj', 'Faridganj', 'Matlab', 'Shahrasti', 'Kachua', 'Haimchar'],
      'Brahmanbaria': ['Brahmanbaria Sadar', 'Ashuganj', 'Bancharampur', 'Kasba', 'Nabinagar', 'Sarail', 'Akhaura', 'Nasirnagar'],
      'Lakshmipur': ['Lakshmipur Sadar', 'Ramganj', 'Raipur', 'Ramgati', 'Kamalnagar']
    }
  },
  'Dhaka': {
    districts: {
      'Dhaka': [
        'Badda', 'Banani', 'Bashundhara', 'Dhanmondi', 'Farmgate',
        'Gulshan', 'Jatrabari', 'Khilgaon', 'Lalbagh', 'Mirpur',
        'Mohammadpur', 'Motijheel', 'Rampura', 'Shyamoli', 'Tejgaon',
        'Uttara', 'Wari'
      ],
      'Gazipur': ['Gazipur Sadar', 'Tongi', 'Board Bazar', 'Konabari', 'Kaliakair', 'Kaliganj', 'Kapasia', 'Sreepur'],
      'Narayanganj': ['Chashara', 'Signboard', 'Siddhirganj', 'Fatullah', 'Kanchpur', 'Narayanganj Sadar', 'Araihazar', 'Bandar', 'Rupganj', 'Sonargaon'],
      'Tangail': ['Tangail Sadar', 'Mirzapur', 'Kalihati', 'Ghatail', 'Madhupur', 'Sakhipur', 'Bhuapur', 'Basail', 'Delduar', 'Nagarpur'],
      'Faridpur': ['Faridpur Sadar', 'Bhanga', 'Alfadanga', 'Boalmari', 'Charbhadrasan', 'Madhukhali', 'Nagarkanda', 'Sadarpur', 'Saltha'],
      'Manikganj': ['Manikganj Sadar', 'Singair', 'Saturia', 'Shibalaya', 'Ghior', 'Harirampur', 'Daulatpur'],
      'Munshiganj': ['Munshiganj Sadar', 'Sirajdikhan', 'Srinagar', 'Tongibari', 'Lohajang', 'Gajaria'],
      'Narsingdi': ['Narsingdi Sadar', 'Madhabdi', 'Belabo', 'Monohardi', 'Palash', 'Raipura', 'Shibpur'],
      'Rajbari': ['Rajbari Sadar', 'Goalanda', 'Pangsha', 'Baliakandi', 'Kalukhali'],
      'Gopalganj': ['Gopalganj Sadar', 'Tungipara', 'Kotalipara', 'Kashiani', 'Muksudpur'],
      'Madaripur': ['Madaripur Sadar', 'Kalkini', 'Rajoir', 'Shibchar'],
      'Shariatpur': ['Shariatpur Sadar', 'Naria', 'Damudya', 'Gosairhat', 'Zanjira', 'Bhedarganj'],
      'Kishoreganj': ['Kishoreganj Sadar', 'Bhairab', 'Bajitpur', 'Karimganj', 'Katiadi', 'Kuliarchar', 'Mithamain', 'Nikli', 'Itna', 'Tarail', 'Hossainpur', 'Pakundia']
    }
  },
  'Khulna': {
    districts: {
      'Khulna': ['Khulna Sadar', 'Boyra', 'Khalishpur', 'Daulatpur', 'Sonadanga', 'Batiaghata', 'Dacope', 'Dumuria', 'Fultala', 'Koyra', 'Paikgachha', 'Phultala', 'Rupsha', 'Terokhada'],
      'Jashore': ['Jashore Sadar', 'Benapole', 'Abhaynagar', 'Bagherpara', 'Chougachha', 'Jhikargachha', 'Keshabpur', 'Manirampur', 'Sharsha'],
      'Bagerhat': ['Bagerhat Sadar', 'Mongla', 'Chitalmari', 'Fakirhat', 'Kachua', 'Mollahat', 'Morrelganj', 'Rampal', 'Sarankhola'],
      'Satkhira': ['Satkhira Sadar', 'Assasuni', 'Debhata', 'Kalaroa', 'Kaliganj', 'Shyamnagar', 'Tala'],
      'Kushtia': ['Kushtia Sadar', 'Kumarkhali', 'Khoksa', 'Mirpur', 'Daulatpur', 'Bheramara'],
      'Meherpur': ['Meherpur Sadar', 'Mujibnagar', 'Gangni'],
      'Chuadanga': ['Chuadanga Sadar', 'Alamdanga', 'Damurhuda', 'Jibannagar'],
      'Jhenaidah': ['Jhenaidah Sadar', 'Kotchandpur', 'Maheshpur', 'Kaliganj', 'Shailkupa', 'Harinakunda'],
      'Magura': ['Magura Sadar', 'Sreepur', 'Shalikha', 'Mohammadpur'],
      'Narail': ['Narail Sadar', 'Kalia', 'Lohagara']
    }
  },
  'Mymensingh': {
    districts: {
      'Mymensingh': ['Mymensingh Sadar', 'Ganginar Par', 'Bhaluka', 'Trishal', 'Gaffargaon', 'Muktagachha', 'Ishwarganj', 'Haluaghat', 'Gouripur', 'Phulpur', 'Dhobaura', 'Nandail', 'Tara Khanda'],
      'Jamalpur': ['Jamalpur Sadar', 'Dewanganj', 'Baxiganj', 'Islampur', 'Melandaha', 'Madarganj', 'Sarishabari'],
      'Netrokona': ['Netrokona Sadar', 'Barhatta', 'Durgapur', 'Kalmakanda', 'Kendua', 'Madan', 'Mohanganj', 'Khaliajuri', 'Purbadhala', 'Atpara'],
      'Sherpur': ['Sherpur Sadar', 'Nakla', 'Nalitabari', 'Jhenaigati', 'Sreebardi']
    }
  },
  'Rajshahi': {
    districts: {
      'Rajshahi': ['Rajshahi Sadar', 'Shaheb Bazar', 'Motihar', 'Boalia', 'Rajpara', 'Godagari', 'Tanore', 'Bagmara', 'Charghat', 'Durgapur', 'Puthia', 'Paba', 'Mohonpur'],
      'Bogra': ['Bogra Sadar', 'Satmatha', 'Sherpur', 'Shajahanpur', 'Kahaloo', 'Nandigram', 'Dupchanchia', 'Adamdighi', 'Sariakandi', 'Gabtali', 'Sonatola', 'Shibganj', 'Dhunat'],
      'Joypurhat': ['Joypurhat Sadar', 'Panchbibi', 'Akkelpur', 'Kalai', 'Khetlal'],
      'Naogaon': ['Naogaon Sadar', 'Patnitala', 'Dhamoirhat', 'Mohadevpur', 'Manda', 'Niamatpur', 'Porsha', 'Sapahar', 'Badalgachhi', 'Raninagar', 'Atrai'],
      'Natore': ['Natore Sadar', 'Singra', 'Baraigram', 'Gurudaspur', 'Bagatipara', 'Lalpur'],
      'Nawabganj': ['Nawabganj Sadar', 'Shibganj', 'Bholahat', 'Nachole', 'Gomastapur'],
      'Pabna': ['Pabna Sadar', 'Ishwardi', 'Sujanagar', 'Chatmohar', 'Bera', 'Santhia', 'Faridpur', 'Atgharia', 'Bhangoora'],
      'Sirajganj': ['Sirajganj Sadar', 'Shahjadpur', 'Ullahpara', 'Belkuchi', 'Kamarkhanda', 'Kazipur', 'Rayganj', 'Tarash', 'Chauhali']
    }
  },
  'Rangpur': {
    districts: {
      'Rangpur': ['Rangpur Sadar', 'Dhap', 'Medical Mor', 'Mithapukur', 'Pirganj', 'Badarganj', 'Gangachhara', 'Kaunia', 'Taraganj', 'Pirgachha'],
      'Dinajpur': ['Dinajpur Sadar', 'Hili', 'Birganj', 'Kaharole', 'Bochaganj', 'Khansama', 'Birampur', 'Nawabganj', 'Ghoraghat', 'Phulbari', 'Parbatipur', 'Chirirbandar'],
      'Gaibandha': ['Gaibandha Sadar', 'Gobindaganj', 'Palashbari', 'Sundarganj', 'Sadullapur', 'Phulchhari', 'Saghata'],
      'Kurigram': ['Kurigram Sadar', 'Nageshwari', 'Bhurungamari', 'Phulbari', 'Rajarhat', 'Ulipur', 'Chilmari', 'Roumari', 'Char Rajibpur'],
      'Lalmonirhat': ['Lalmonirhat Sadar', 'Aditmari', 'Kaliganj', 'Hatibandha', 'Patgram'],
      'Nilphamari': ['Nilphamari Sadar', 'Saidpur', 'Domar', 'Dimla', 'Jaldhaka', 'Kishoreganj'],
      'Panchagarh': ['Panchagarh Sadar', 'Boda', 'Debiganj', 'Atwari', 'Tetulia'],
      'Thakurgaon': ['Thakurgaon Sadar', 'Pirganj', 'Baliadangi', 'Haripur', 'Ranisankail']
    }
  },
  'Sylhet': {
    districts: {
      'Sylhet': ['Zindabazar', 'Bandarbazar', 'Amberkhana', 'Shibgonj', 'Shahjalal Uposhohor', 'Sylhet Sadar', 'Golapganj', 'Beanibazar', 'Balaganj', 'Bishwanath', 'Fenchuganj', 'Gowainghat', 'Jaintiapur', 'Kanaighat', 'Zakiganj', 'Companiganj', 'Dakshin Surma'],
      'Moulvibazar': ['Moulvibazar Sadar', 'Sreemangal', 'Kulaura', 'Rajnagar', 'Kamalganj', 'Barlekha', 'Juri'],
      'Habiganj': ['Habiganj Sadar', 'Chunarughat', 'Madhabpur', 'Nabiganj', 'Bahubal', 'Baniyachong', 'Ajmiriganj', 'Lakhai'],
      'Sunamganj': ['Sunamganj Sadar', 'Chhatak', 'Jagannathpur', 'Derai', 'Shalla', 'Dharampasha', 'Tahirpur', 'Bishwamambarpur', 'Duarabazar', 'Jamalganj']
    }
  }
};
