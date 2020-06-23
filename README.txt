Name: Frizler Dimitri
Matnr:3198652
Email: dimitri1.frizler@st.oth-regensburg.de




Databank access
	postgres://hjrbveopylyfxu:5df3e165b3eaefa6529dca0a624a486cac4ccde581647ec6b27055358a67a2f9@ec2-54-247-171-30.eu-west-1.compute.amazonaws.com:5432/daabkbjibff3lt
	
TestUser
	username: test
	pw	: test



Importent : For same reason my import.js couldn't import books that have a "," in their title so it just the 4838 Books without the comma in the database
	

	
How this side works

	if the user is not logged in
		You can search for books if you not logged in but in the detail side you can not see reviews and the rating
		
	if the user is logged in
		He can post reviews but he must fill the textfield und select the stars (1-5)
	
	Registration
		one username can only exist one time two user with the same username isn't possible
		
	search
		you can search for example for Jane Green or just Jane or Green to find matching books
		
	post Critc 
		you can only post one critic for the same book, for one user you need to change the account if you want to post a another critic to the same book
		