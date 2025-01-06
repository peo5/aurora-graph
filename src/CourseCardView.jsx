function CourseCardView({code, name, picture}) {
	return (
		<div className = "course-card" >
			<img className = "picture" src = {picture} />
			<span className = "code" >{code}</span>
			<span className = "name" >{name}</span>
		</div>
	)
}

export default CourseCardView
